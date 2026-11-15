# Product Backlog

Backlog priorizado do Kumoko Scan. Cada história tem formato
"Como <persona>, quero <ação>, para <benefício>", prioridade **MoSCoW**
(Must / Should / Could / Won't nesta versão), estimativa em **story points**
(Fibonacci) e critérios de aceite em **Gherkin**. A mesma lista, com tasks e bugs,
está pronta para importação em [`jira-import.csv`](./jira-import.csv) (o prefixo
`[US-xx]` no resumo liga os dois).

## 1. Personas

| Persona | Descrição |
|---|---|
| **Leitor** | Visitante sem login que navega no catálogo e lê capítulos |
| **Cliente** | Leitor autenticado que compra obras e acompanha pedidos |
| **Administrador** | Mantém o acervo (obras, capas, capítulos, páginas) |
| **Equipe / Operador** | Desenvolve, implanta e opera o sistema |

## 2. Épicos

| Épico | Objetivo | Serviço principal |
|---|---|---|
| EP-1 Catálogo e Leitura | Encontrar e ler obras | catalog-service + frontend |
| EP-2 Identidade e Acesso | Cadastro, login seguro e perfil | auth-service |
| EP-3 Vendas | Carrinho, checkout confiável e histórico | order-service |
| EP-4 Gestão do Acervo | Administração de obras, capítulos e páginas | catalog-service (admin) |
| EP-5 Plataforma e Entrega | Microsserviços, gateway, Compose, CI/CD | infra |
| EP-6 Qualidade e Operação | Observabilidade, resiliência, segurança, documentação | transversal |

## 3. Backlog priorizado (visão geral)

Ordem = prioridade. O status de cada item está na coluna `Status` de
[`jira-import.csv`](./jira-import.csv): "Concluído" para entregas das versões v0.x,
"Em revisão" para itens implementados na reestruturação v1.0.0 aguardando validação
ponta a ponta (smoke test no Compose) e "Backlog" para itens futuros.

| # | ID | História (resumo) | Épico | MoSCoW | SP | Versão |
|---|---|---|---|---|---|---|
| 1 | US-14 | Finalizar compra com preço calculado no servidor | EP-3 | Must | 8 | v1.0.0 |
| 2 | US-09 | Login/logout seguro com cookie httpOnly | EP-2 | Must | 5 | v1.0.0 |
| 3 | US-11 | Admin provisionado de forma controlada | EP-2 | Must | 2 | v1.0.0 |
| 4 | US-08 | Cadastro de cliente com CPF válido | EP-2 | Must | 3 | v0.2.0 → v1.0.0 |
| 5 | US-01 | Navegar no catálogo filtrando por tipo | EP-1 | Must | 5 | v0.1.0 → v1.0.0 |
| 6 | US-04 | Ver detalhes da obra | EP-1 | Must | 3 | v0.1.0 → v1.0.0 |
| 7 | US-05 | Ler capítulo com todas as páginas em ordem | EP-1 | Must | 5 | v1.0.0 |
| 8 | US-13 | Carrinho com quantidades | EP-3 | Must | 3 | v0.2.0 → v1.0.0 |
| 9 | US-15 | Checkout idempotente (sem cobrança duplicada) | EP-3 | Must | 3 | v1.0.0 |
| 10 | US-16 | Histórico de pedidos | EP-3 | Must | 3 | v0.2.0 → v1.0.0 |
| 11 | US-18 | Cadastrar obra com capa | EP-4 | Must | 5 | v0.2.0 → v1.0.0 |
| 12 | US-19 | Editar e excluir obra | EP-4 | Must | 3 | v0.2.0 → v1.0.0 |
| 13 | US-20 | Gerenciar capítulos | EP-4 | Must | 3 | v1.0.0 |
| 14 | US-21 | Enviar páginas do capítulo | EP-4 | Must | 5 | v1.0.0 |
| 15 | US-23 | Subir o sistema com um comando | EP-5 | Must | 5 | v1.0.0 |
| 16 | US-24 | Pipeline CI (lint, testes, build, smoke) | EP-5 | Must | 5 | v1.0.0 |
| 17 | US-07 | Catálogo rápido com cache distribuído | EP-1 | Must | 5 | v1.0.0 |
| 18 | US-26 | Logs correlacionados e métricas | EP-6 | Must | 5 | v1.0.0 |
| 19 | US-02 | Buscar obras por nome | EP-1 | Must | 3 | v1.0.0 |
| 20 | US-17 | Mensagem clara quando o checkout está indisponível | EP-3 | Should | 5 | v1.0.0 |
| 21 | US-03 | Ordenar catálogo | EP-1 | Should | 3 | v1.0.0 |
| 22 | US-06 | Destaques na home | EP-1 | Should | 3 | v1.0.0 |
| 23 | US-10 | Editar perfil e trocar senha | EP-2 | Should | 3 | v1.0.0 |
| 24 | US-22 | Tabela do acervo para o admin | EP-4 | Should | 3 | v1.0.0 |
| 25 | US-27 | Recuperação automática de falhas | EP-6 | Should | 3 | v1.0.0 |
| 26 | US-12 | Total gasto atualizado após compra | EP-2 | Could | 3 | v1.0.0 |
| 27 | US-25 | Publicação de imagens e deploy com rollback | EP-5 | Could | 5 | v1.0.0 (esqueleto) |
| 28 | US-29 | Dashboards de SLO (Prometheus/Grafana) | EP-6 | Could | 5 | v1.1.0 |
| 29 | US-30 | Entrega garantida de eventos | EP-6 | Could | 8 | v1.2.0 |
| 30 | US-31 | Continuar a leitura de onde parei | EP-1 | Could | 5 | v1.2.0 |
| 31 | US-28 | Pagar com Pix ou cartão | EP-3 | Won't (agora) | 13 | v2.0.0 |

Critérios de priorização: (1) risco de segurança/integridade financeira primeiro;
(2) fluxo principal do leitor/cliente; (3) capacidade do administrador manter o
acervo; (4) itens exigidos para entrega e operação; (5) melhorias.

## 4. User Stories com critérios de aceite

### EP-1 Catálogo e Leitura

**US-01 — Navegar por tipo** · Must · 5 SP
Como **leitor**, quero navegar no catálogo filtrando por mangá, livro ou novel, para
encontrar o tipo de obra que gosto.

```gherkin
Cenário: filtrar por tipo
  Dado que existem mangás e livros cadastrados
  Quando acesso "/catalogo?tipo=manga"
  Então vejo apenas obras do tipo "manga"
  E a lista é paginada com 12 itens por página

Cenário: catálogo vazio
  Dado que não há novels cadastradas
  Quando filtro por "novel"
  Então vejo a mensagem de lista vazia em vez de erro
```

**US-02 — Buscar por nome** · Must · 3 SP
Como **leitor**, quero buscar obras pelo nome, para achar rapidamente um título.

```gherkin
Cenário: busca parcial sem diferenciar maiúsculas
  Dado que existe a obra "Dandadan"
  Quando busco "danda" pelo campo do cabeçalho
  Então sou levado a "/catalogo?busca=danda"
  E "Dandadan" aparece nos resultados
```

**US-03 — Ordenar** · Should · 3 SP
Como **leitor**, quero ordenar por recentes, nome, preço ou mais vendidos, para
comparar opções.

```gherkin
Cenário: ordenar por menor preço
  Quando escolho a ordenação "preço crescente"
  Então a API é chamada com "ordenar=preco-asc"
  E cada obra listada tem preço maior ou igual ao da anterior
```

**US-04 — Detalhes da obra** · Must · 3 SP
Como **leitor**, quero ver capa, descrição, preço e capítulos de uma obra, para decidir
se leio ou compro.

```gherkin
Cenário: obra existente
  Quando acesso "/obras/3"
  Então vejo nome, capa, descrição, preço e a lista de capítulos ordenada por número

Cenário: obra inexistente
  Quando acesso "/obras/9999"
  Então vejo a página "Obra não encontrada" e a API respondeu 404
```

**US-05 — Leitor de capítulo** · Must · 5 SP
Como **leitor**, quero ler um capítulo com todas as páginas em sequência vertical, para
ler sem trocar de tela.

```gherkin
Cenário: todas as páginas em ordem
  Dado que o capítulo 10 tem 18 páginas
  Quando abro "/obras/3/capitulos/10"
  Então as 18 imagens são exibidas na ordem do campo "numero"
  # corrige o bug do legado em que a rota devolvia só uma página
```

**US-06 — Destaques na home** · Should · 3 SP
Como **leitor**, quero ver os mais vendidos e os lançamentos na home, para descobrir obras.

```gherkin
Cenário: seções de destaque
  Quando acesso "/"
  Então vejo a seção "Mais vendidos" ordenada por totalVendido
  E a seção "Recentes" ordenada por data de criação
```

**US-07 — Catálogo rápido com cache** · Must · 5 SP
Como **leitor**, quero que o catálogo responda rápido mesmo com muitos acessos, para
navegar sem espera.

```gherkin
Cenário: segunda leitura vem do cache
  Dado que a obra 1 não está em cache
  Quando faço GET /api/obras/1 duas vezes
  Então a primeira resposta tem "X-Cache: MISS" e a segunda "X-Cache: HIT"

Cenário: atualização invalida o cache
  Dado que a obra 1 está em cache
  Quando o administrador altera o preço da obra 1
  Então a próxima leitura tem "X-Cache: MISS" e já mostra o preço novo

Cenário: Redis fora do ar
  Dado que o Redis está parado
  Quando faço GET /api/obras
  Então recebo 200 com dados do banco
```

**US-31 — Continuar leitura** · Could · 5 SP · v1.2.0
Como **cliente**, quero continuar a leitura do último capítulo aberto, para não procurar
onde parei.

```gherkin
Cenário: retomar leitura
  Dado que li até o capítulo 5 da obra 3
  Quando abro a obra 3
  Então vejo o botão "Continuar do capítulo 5"
```

### EP-2 Identidade e Acesso

**US-08 — Cadastro** · Must · 3 SP
Como **visitante**, quero me cadastrar com nome, e-mail, CPF e senha, para poder comprar.

```gherkin
Cenário: cadastro válido
  Quando envio nome, e-mail novo, CPF válido e senha "Segura123"
  Então recebo 201 com papel "customer"
  E a resposta não contém senha nem CPF

Cenário: CPF inválido ou senha fraca
  Quando envio CPF "12345678900" ou senha "abc"
  Então recebo 400 com a lista de erros de validação

Cenário: e-mail ou CPF repetido
  Dado que o e-mail já está cadastrado
  Quando tento cadastrar de novo
  Então recebo 409
```

**US-09 — Login e logout seguros** · Must · 5 SP
Como **cliente**, quero entrar e sair da conta com segurança, para que ninguém use minha sessão.

```gherkin
Cenário: login com sucesso
  Quando envio e-mail e senha corretos
  Então recebo 200 e o cookie "kumoko_token" com HttpOnly, Secure e SameSite=Strict
  E o frontend não grava token em localStorage

Cenário: credenciais erradas
  Quando envio senha errada ou e-mail inexistente
  Então recebo 401 com a mensagem "Credenciais inválidas."

Cenário: força bruta
  Quando faço mais de 5 tentativas em 1 minuto
  Então recebo 429

Cenário: logout
  Dado que estou logado
  Quando clico em "Sair"
  Então o cookie é removido e GET /api/users/me responde 401
```

**US-10 — Perfil** · Should · 3 SP
Como **cliente**, quero editar meu nome e trocar a senha, para manter meus dados atualizados.

```gherkin
Cenário: trocar senha exige senha atual
  Quando envio "novaSenha" sem "senhaAtual"
  Então recebo 400

Cenário: troca válida
  Quando envio senhaAtual correta e novaSenha forte
  Então recebo 200 e consigo entrar com a nova senha
```

**US-11 — Admin provisionado** · Must · 2 SP
Como **administrador**, quero que a conta de admin seja criada só pela configuração do
ambiente, para que ninguém vire admin pelo cadastro público.

```gherkin
Cenário: cadastro público nunca cria admin
  Quando alguém se cadastra com o e-mail configurado em ADMIN_EMAIL
  Então o cadastro é recusado (409) ou cria apenas "customer"

Cenário: seed idempotente
  Dado ADMIN_EMAIL e ADMIN_PASSWORD no .env
  Quando o auth-service reinicia duas vezes
  Então existe exatamente um usuário admin com esse e-mail
```

**US-12 — Total gasto** · Could · 3 SP
Como **cliente**, quero ver meu total gasto atualizado após cada compra, para acompanhar
meus gastos.

```gherkin
Cenário: atualização por evento
  Dado que meu totalGasto é 0
  Quando concluo um pedido de 89,70
  Então em até 5 segundos GET /api/users/me mostra totalGasto 89.7

Cenário: evento repetido
  Quando o mesmo evento order.completed é entregue duas vezes
  Então o total é somado uma única vez
```

### EP-3 Vendas

**US-13 — Carrinho** · Must · 3 SP
Como **cliente**, quero adicionar obras ao carrinho e ajustar quantidades, para comprar
várias de uma vez.

```gherkin
Cenário: carrinho persiste no navegador
  Dado que adicionei 2 obras ao carrinho
  Quando recarrego a página
  Então o carrinho continua com as 2 obras e o badge mostra a quantidade

Cenário: limites
  Quando tento definir quantidade 0 ou acima de 99
  Então o valor é ajustado para o limite permitido
```

**US-14 — Checkout com preço do servidor** · Must · 8 SP
Como **cliente**, quero finalizar a compra com o preço calculado pelo servidor, para
pagar o valor correto do catálogo.

```gherkin
Cenário: pedido criado
  Dado que estou autenticado e a obra 3 custa 29,90 no catálogo
  Quando envio {"itens":[{"obraId":3,"quantidade":2}]}
  Então recebo 201 com total 59.8 e status "CONCLUIDO"
  E o evento "order.completed" é publicado

Cenário: preço adulterado
  Quando envio um campo "preco" junto ao item
  Então recebo 400 e nenhum pedido é criado

Cenário: obra inexistente
  Quando envio obraId 9999
  Então recebo 422 informando o id inexistente

Cenário: sem login
  Quando envio o pedido sem cookie ou token
  Então recebo 401
```

**US-15 — Checkout idempotente** · Must · 3 SP
Como **cliente**, quero não ser cobrado duas vezes se clicar duas vezes em "Finalizar",
para evitar pedidos duplicados.

```gherkin
Cenário: mesma chave
  Dado que finalizei um pedido com Idempotency-Key "abc"
  Quando reenvio a mesma requisição com a chave "abc"
  Então recebo 200 com o mesmo pedido
  E existe apenas um pedido para essa chave
```

**US-16 — Histórico** · Must · 3 SP
Como **cliente**, quero consultar meus pedidos, para lembrar o que comprei.

```gherkin
Cenário: só meus pedidos
  Quando acesso "/pedidos"
  Então vejo apenas pedidos do meu usuário, mais recentes primeiro, paginados

Cenário: pedido de outro usuário
  Quando acesso GET /api/pedidos/{id} de outro cliente
  Então recebo 404
```

**US-17 — Checkout indisponível** · Should · 5 SP
Como **cliente**, quero uma mensagem clara quando o checkout estiver indisponível, para
saber que posso tentar novamente.

```gherkin
Cenário: catálogo fora do ar
  Dado que o catalog-service está parado
  Quando finalizo a compra
  Então recebo 503 "Catálogo indisponível no momento. Tente novamente em instantes." em menos de 3 segundos
  E o carrinho continua preenchido

Cenário: circuito aberto
  Dado que o circuito para o catálogo está aberto
  Quando finalizo a compra
  Então a resposta 503 é imediata, sem esperar timeout
```

**US-28 — Pagamento real** · Won't (agora) · 13 SP · v2.0.0
Como **cliente**, quero pagar com Pix ou cartão, para concluir a compra de verdade.

```gherkin
Cenário: pedido aguardando pagamento
  Quando finalizo a compra
  Então o pedido fica "AGUARDANDO_PAGAMENTO" até a confirmação do provedor
```

### EP-4 Gestão do Acervo

**US-18 — Cadastrar obra** · Must · 5 SP
Como **administrador**, quero cadastrar uma obra com capa, para disponibilizá-la no catálogo.

```gherkin
Cenário: cadastro com capa
  Dado que estou logado como admin
  Quando envio tipo, nome, preço e uma imagem JPG de 1 MB
  Então recebo 201 com capaUrl iniciando em "/files/covers/"

Cenário: arquivo falso
  Quando envio um arquivo .jpg que não é imagem
  Então recebo 400

Cenário: cliente comum
  Dado que estou logado como customer
  Quando tento cadastrar uma obra
  Então recebo 403
```

**US-19 — Editar e excluir obra** · Must · 3 SP
Como **administrador**, quero editar e excluir obras, para manter o acervo correto.

```gherkin
Cenário: trocar capa
  Quando envio uma nova capa
  Então a capa antiga é apagada do volume

Cenário: excluir obra
  Quando excluo a obra 3
  Então recebo 204, seus capítulos e páginas somem e os arquivos são removidos
  E o evento "catalog.obra.deleted" é publicado
```

**US-20 — Capítulos** · Must · 3 SP
Como **administrador**, quero criar, editar e excluir capítulos, para organizar a leitura.

```gherkin
Cenário: número repetido
  Dado que a obra 3 tem o capítulo 1
  Quando crio outro capítulo número 1 na obra 3
  Então recebo 409

Cenário: capítulo intermediário
  Quando crio o capítulo 1.5
  Então ele aparece entre 1 e 2 na listagem
```

**US-21 — Páginas** · Must · 5 SP
Como **administrador**, quero enviar as páginas de um capítulo, para que os leitores possam lê-lo.

```gherkin
Cenário: número automático
  Dado que o capítulo tem 3 páginas
  Quando envio uma imagem sem número
  Então ela é criada como página 4
```

**US-22 — Tabela do acervo** · Should · 3 SP
Como **administrador**, quero ver o acervo em tabela com ações de editar e excluir, para
gerenciar rapidamente.

```gherkin
Cenário: confirmação de exclusão
  Quando clico em "Excluir" em uma obra
  Então vejo uma confirmação na própria página antes da exclusão
```

### EP-5 Plataforma e Entrega

**US-23 — Subir com um comando** · Must · 5 SP
Como **avaliador**, quero subir o sistema inteiro com um comando, para testar sem
configuração manual.

```gherkin
Cenário: primeira subida
  Dado uma máquina com Docker e o .env copiado do .env.example
  Quando executo "docker compose up -d --build --wait"
  Então todos os containers ficam "healthy"
  E https://localhost:8443 abre o site com o catálogo de exemplo
  E só as portas 8080 e 8443 estão publicadas no host
```

**US-24 — Pipeline CI** · Must · 5 SP
Como **equipe**, quero que cada push rode lint, testes, build e smoke test, para não
integrar código quebrado.

```gherkin
Cenário: PR com teste quebrado
  Quando abro um PR com um teste falhando
  Então o job "backend" falha e o PR fica bloqueado
```

**US-25 — Imagens e deploy** · Could · 5 SP
Como **equipe**, quero imagens versionadas por commit e um deploy com rollback, para
publicar com segurança.

```gherkin
Cenário: rollback
  Dado que o deploy do sha B falhou no smoke test
  Quando executo o rollback para o sha A
  Então os containers voltam para a imagem A e o smoke test passa
```

### EP-6 Qualidade e Operação

**US-26 — Logs e métricas** · Must · 5 SP
Como **operador**, quero logs JSON com request-id e métricas de latência, para
diagnosticar incidentes.

```gherkin
Cenário: correlação
  Dado uma requisição de checkout com X-Request-Id "r1"
  Quando procuro "r1" nos logs
  Então encontro o gateway, o order-service, a chamada ao catálogo e o correlationId do evento

Cenário: dados sensíveis
  Quando faço login
  Então nenhum log contém a senha, o cookie ou o header Authorization
```

**US-27 — Recuperação automática** · Should · 3 SP
Como **operador**, quero que os serviços se recuperem sozinhos de quedas, para reduzir
intervenção manual.

```gherkin
Cenário: crash de serviço
  Quando o container do order-service é encerrado
  Então ele é reiniciado e volta a "healthy" em até 60 segundos
```

**US-29 — Dashboards de SLO** · Could · 5 SP · v1.1.0
Como **operador**, quero dashboards de latência, erros e error budget, para acompanhar os SLOs.

**US-30 — Entrega garantida de eventos** · Could · 8 SP · v1.2.0
Como **equipe**, quero que eventos não se percam quando um consumidor está fora, para
manter contadores corretos (Redis Streams ou Outbox).

## 5. Sprints

| Sprint | Período | Objetivo | Versão |
|---|---|---|---|
| Sprint 1 | jun/2026 | Catálogo web + API Express | v0.1.0 |
| Sprint 2 | jun/2026 | Segurança básica, CSP no Nginx, testes e2e de perfil | v0.1.0 |
| Sprint 3 | set/2026 | Cadastro/login, carrinho, compras, upload | v0.2.0 |
| Sprint 4 | set/2026 | App mobile e gestão do acervo no mobile | v0.3.0 |
| Sprint 5 | nov/2026 | Auditoria técnica, protótipo NestJS, testes de integração | v0.4.0 |
| Sprint 6 | nov/2026 | Reestruturação em microsserviços (backend, infra, frontend, docs) | v1.0.0 |
| Sprint 7 | a planejar | Observabilidade com Prometheus/Grafana, ajustes de SLO | v1.1.0 |
| Sprint 8 | a planejar | Eventos duráveis, continuar leitura | v1.2.0 |

## 6. Versionamento e lançamentos parciais

### SemVer

`MAJOR.MINOR.PATCH`:

- **MAJOR** — quebra de contrato público (rotas, formato JSON, eventos) ou de arquitetura
  (ex.: v1.0.0, monólito → microsserviços).
- **MINOR** — funcionalidade nova compatível (novo endpoint, novo filtro, novo evento).
- **PATCH** — correção sem mudança de contrato.
- Pré-lançamento: `v1.1.0-rc.1` para homologação antes do release.

### Plano de releases

| Versão | Data | Conteúdo | Estado |
|---|---|---|---|
| v0.1.0 | 2026-06-25 | Catálogo online: site React + API Express/Sequelize + MariaDB; Nginx com CSP | Lançada (legado) |
| v0.2.0 | 2026-09-14 | E-commerce: cadastro/login JWT, carrinho, compras, histórico, painel admin, upload | Lançada (legado) |
| v0.3.0 | 2026-09-17 | App mobile React Native/Expo (arquivado depois em `archive/mobile`) | Lançada e descontinuada |
| v0.4.0 | 2026-11-12 | Auditoria, protótipo NestJS, testes de integração, remoção de chave TLS versionada | Interna |
| **v1.0.0** | 2026-11 | Microsserviços NestJS, gateway Nginx, Redis (cache + Pub/Sub), MariaDB por serviço, novo frontend, CI/CD e documentação | Em homologação |
| v1.1.0 | a definir | Prometheus + Grafana, métricas de cache/eventos | Planejada |
| v1.2.0 | a definir | Eventos duráveis (Streams/Outbox), continuar leitura | Planejada |
| v2.0.0 | a definir | Pagamentos reais (novo contexto, status de pedido muda) | Ideia |

As versões v0.x foram reconstruídas a partir do histórico do Git (não havia tags na época).

### Convenções

- **Tags Git anotadas:** `git tag -a v1.0.0 -m "v1.0.0 - microsserviços"` na branch `main`
  após o merge de `dev`; `git push origin v1.0.0`.
- **Branches:** `main` (produção), `dev` (integração), `feature/KUM-123-descricao`,
  `fix/KUM-130-descricao`, `refactor/...`.
- **Commits:** Conventional Commits com a chave do Jira:
  `feat(order): checkout idempotente KUM-115`, `fix(auth): remove fallback do segredo JWT KUM-131`.
- **CHANGELOG:** [`CHANGELOG.md`](../../CHANGELOG.md) no formato Keep a Changelog; a seção
  `[Não lançado]` recebe as mudanças de cada PR e vira a nova versão no release.
- **Jira:** cada versão é uma *Fix Version*; o board de release mostra o que falta.
- **Imagens:** a CI publica `:sha` e `:latest`; no release, as imagens também devem ser
  marcadas com a versão (`:1.0.0`) — evolução prevista do workflow.
- **Lançamentos parciais:** como cada serviço tem imagem própria, uma correção em um
  serviço pode ser implantada isoladamente (PATCH), desde que não quebre o contrato.
