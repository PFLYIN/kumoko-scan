# Cenários de Atributos de Qualidade

Formato SEI (Bass, Clements, Kazman): **fonte → estímulo → artefato → ambiente →
resposta → medida da resposta**. As medidas são **metas** de projeto; o que já foi
verificado está marcado na coluna "Como verificar" e o estado real deve ser registrado
nas evidências de cada entrega. Os SLOs derivados estão em
[`../operacao/slo-sli.md`](../operacao/slo-sli.md).

## Resumo

| ID | Atributo | Cenário em uma linha | Medida (meta) |
|---|---|---|---|
| QS-01 | Desempenho | Listar catálogo com cache quente | p95 < 100 ms no serviço |
| QS-02 | Disponibilidade | Redis cai durante navegação | 0 erros 5xx causados pelo cache |
| QS-03 | Resiliência | Catálogo fora do ar no checkout | 503 em < 3 s (catálogo parado); circuito abre; nenhum pedido parcial |
| QS-04 | Integridade | Cliente adultera preço no checkout | 100% dos pedidos com preço do catálogo |
| QS-05 | Confiabilidade | Duplo clique / retry em "Finalizar compra" | 1 pedido por `Idempotency-Key` |
| QS-06 | Segurança | Cliente comum chama rota admin | 100% bloqueadas com 403 |
| QS-07 | Segurança | Força bruta no login | 429 após o limite; senha nunca em log |
| QS-08 | Consistência | Pedido concluído atualiza contadores | `total_gasto`/`total_vendido` atualizados em < 5 s |
| QS-09 | Observabilidade | Investigar um erro relatado | Fluxo completo encontrado por 1 `X-Request-Id` em < 5 min |
| QS-10 | Implantabilidade | Subir o ambiente do zero | `docker compose up -d --build --wait` saudável em < 5 min |
| QS-11 | Modificabilidade | Adicionar um novo tipo de obra | Mudança restrita ao catalog-service + 1 migration |
| QS-12 | Recuperabilidade | Container de serviço morre | Reiniciado automaticamente e saudável em < 60 s |

## Cenários detalhados

### QS-01 — Desempenho da leitura do catálogo

| Parte | Descrição |
|---|---|
| Fonte | Leitor anônimo |
| Estímulo | `GET /api/obras?tipo=manga&ordenar=mais-vendidos` repetido por vários leitores |
| Artefato | catalog-service + Redis |
| Ambiente | Operação normal, cache quente (chave `catalog:obras:list:<hash>` existe) |
| Resposta | Resposta servida do Redis, header `X-Cache: HIT`, sem consulta ao MariaDB |
| Medida | p95 de `http_request_duration_seconds{service="catalog-service",route=~".*/obras"}` < 100 ms; < 250 ms com cache frio |
| Como verificar | `scripts/demo-cache.sh` (MISS → HIT) e histograma em `/metrics` |

### QS-02 — Disponibilidade com Redis indisponível

| Parte | Descrição |
|---|---|
| Fonte | Falha de infraestrutura |
| Estímulo | `docker compose stop redis` |
| Artefato | `CacheService` (`@kumoko/cache`) |
| Ambiente | Usuários navegando no catálogo |
| Resposta | `getOrSet` registra `warn` e consulta o banco; a requisição responde normalmente (sem `X-Cache: HIT`) |
| Medida | 0 respostas 5xx atribuídas ao cache; latência volta ao patamar de cache frio |
| Como verificar | Parar o Redis, repetir `GET /api/obras`, observar logs `warn` e status 200 |

### QS-03 — Resiliência do checkout com catálogo indisponível

| Parte | Descrição |
|---|---|
| Fonte | Falha do catalog-service (crash, deploy, lentidão) |
| Estímulo | `POST /api/pedidos` enquanto `catalog-service` está parado ou lento |
| Artefato | `CatalogClient` (axios + retry + opossum) no order-service |
| Ambiente | Cache de preços expirado |
| Resposta | Timeout de 2000 ms por tentativa, até 2 retries com backoff só em erro de rede/5xx; após 50% de falhas o circuito abre e as próximas chamadas falham imediatamente; resposta `503 "Catálogo indisponível no momento. Tente novamente em instantes."`; nenhum pedido gravado; circuito testa (half-open) após 10 s |
| Medida | Com o catálogo parado (conexão recusada), 503 em < 3 s; com o catálogo lento, no máximo ~7 s (3 tentativas de 2 s + backoff), sempre abaixo do proxy_read_timeout de 30 s; com o circuito aberto, < 50 ms; 0 pedidos parciais |
| Como verificar | `docker compose stop catalog-service`, checkout pela API, logs `Circuit breaker OPEN/HALF_OPEN/CLOSED` |

### QS-04 — Integridade do preço

| Parte | Descrição |
|---|---|
| Fonte | Cliente mal-intencionado |
| Estímulo | Envia `preco`, `total` ou `precoUnitario` no corpo de `POST /api/pedidos` |
| Artefato | `CreatePedidoDto` + `ValidationPipe` (`forbidNonWhitelisted`) + aggregate `Pedido` |
| Ambiente | Operação normal |
| Resposta | Campos extras rejeitados com 400; preço sempre obtido do catálogo |
| Medida | 100% dos pedidos com `preco_unitario` igual ao preço do catálogo no instante da compra |
| Como verificar | Teste unitário do aggregate e chamada manual com campo extra |

### QS-05 — Idempotência do checkout

| Parte | Descrição |
|---|---|
| Fonte | Cliente (duplo clique, retry de rede, refresh) |
| Estímulo | Dois `POST /api/pedidos` com o mesmo `Idempotency-Key` |
| Artefato | order-service + `UNIQUE(usuario_id, idempotency_key)` |
| Ambiente | Operação normal |
| Resposta | Primeira chamada 201; segunda devolve 200 com o mesmo pedido; um único `order.completed` |
| Medida | 1 linha em `pedidos` por chave e usuário |
| Como verificar | `scripts/smoke-test.sh` / requisição repetida com `curl` |

### QS-06 — Autorização administrativa

| Parte | Descrição |
|---|---|
| Fonte | Usuário autenticado com papel `customer` (ou anônimo) |
| Estímulo | `POST/PATCH/DELETE /api/obras`, `/api/capitulos`, `/api/paginas` |
| Artefato | `JwtAuthGuard` (negação por padrão) + `RolesGuard` |
| Ambiente | Operação normal |
| Resposta | 401 sem token; 403 com token de cliente; nada é alterado |
| Medida | 100% das rotas administrativas bloqueadas (teste automatizado dos guards) |
| Como verificar | Testes `roles.guard.spec.ts`/`jwt-auth.guard.spec.ts` e smoke test |

### QS-07 — Força bruta no login

| Parte | Descrição |
|---|---|
| Fonte | Script automatizado |
| Estímulo | Dezenas de `POST /api/auth/login` por minuto do mesmo IP |
| Artefato | Gateway (`auth_limit` 10 r/min, burst 5) + throttler do serviço (5/min) |
| Ambiente | Operação normal |
| Resposta | 429 após o limite; mensagem genérica "Credenciais inválidas." antes disso |
| Medida | No máximo ~15 tentativas por minuto por IP chegam ao serviço; nenhum log contém senha, cookie ou `Authorization` (redação do pino) |
| Como verificar | Loop de `curl` e inspeção de `docker compose logs auth-service` |

### QS-08 — Consistência eventual por eventos

| Parte | Descrição |
|---|---|
| Fonte | order-service |
| Estímulo | Pedido concluído publica `order.completed` |
| Artefato | `EventBus` + listeners no auth-service e catalog-service |
| Ambiente | Todos os serviços conectados ao Redis |
| Resposta | auth soma `total_gasto`; catalog soma `total_vendido` e invalida `catalog:obras:`; reentrega do mesmo `id` é ignorada |
| Medida | Contadores atualizados em < 5 s após o 201; 0 contagens em dobro |
| Como verificar | `scripts/demo-events.sh` e logs `Evento publicado` / `Evento recebido` / `Evento processado` com o mesmo `correlationId` |
| Limitação aceita | Se o consumidor estiver desconectado na publicação, o evento é perdido (ver ADR-003) |

### QS-09 — Diagnóstico com correlação

| Parte | Descrição |
|---|---|
| Fonte | Usuário relata erro e informa o horário (ou o `requestId` do corpo do erro) |
| Estímulo | Necessidade de investigar |
| Artefato | Logs JSON do gateway e dos serviços |
| Ambiente | Pós-incidente |
| Resposta | O mesmo `X-Request-Id` aparece no log do Nginx, no serviço chamado, na chamada ao catálogo e no `correlationId` dos eventos |
| Medida | Fluxo completo reconstruído em < 5 min com `docker compose logs | grep <id>` |

### QS-10 — Implantabilidade

| Parte | Descrição |
|---|---|
| Fonte | Desenvolvedor ou avaliador |
| Estímulo | Clona o repositório e roda `cp .env.example .env && docker compose up -d --build --wait` |
| Artefato | Docker Compose, Dockerfiles, migrations e seed |
| Ambiente | Máquina com Docker, sem dados prévios |
| Resposta | Banco criado, migrations aplicadas, admin e catálogo de exemplo semeados, todos os healthchecks verdes |
| Medida | < 5 min na primeira subida (depende de download de imagens); zero passos manuais além do `.env` |

### QS-11 — Modificabilidade

| Parte | Descrição |
|---|---|
| Fonte | Time de produto |
| Estímulo | Novo tipo de obra (ex.: `webtoon`) |
| Artefato | catalog-service e contrato |
| Ambiente | Desenvolvimento |
| Resposta | Alterar o enum `TipoObra`, criar 1 migration, atualizar o OpenAPI e o filtro do frontend |
| Medida | Nenhuma alteração em auth-service; order-service só precisa aceitar o novo valor no tipo do snapshot |

### QS-12 — Recuperação automática

| Parte | Descrição |
|---|---|
| Fonte | Falha de processo |
| Estímulo | `docker compose kill order-service` ou exceção fatal |
| Artefato | Política `restart: unless-stopped` + healthcheck |
| Ambiente | Operação normal |
| Resposta | Container reiniciado; TypeORM reconecta (até 10 tentativas, 3 s); assinaturas Pub/Sub refeitas |
| Medida | Serviço `healthy` novamente em < 60 s |
