# Runbook de incidentes

Procedimentos para diagnosticar e mitigar incidentes no ambiente Docker Compose.
Comandos executados na raiz do repositório (ou no diretório do Compose no servidor).

## 0. Primeiros 5 minutos (qualquer incidente)

1. **Classificar a severidade** (tabela abaixo) e abrir um Bug no Jira com label `incidente`.
2. **Foto do estado:**
   ```bash
   docker compose ps
   docker compose logs --since 15m --no-log-prefix gateway | tail -n 50
   docker compose logs --since 15m auth-service catalog-service order-service | grep -E '"level":(40|50)'
   ```
3. **Pegar um `requestId`** do corpo do erro (ou do header `X-Request-Id`) relatado pelo usuário e seguir:
   `docker compose logs --no-log-prefix | grep <requestId>`.
4. **Houve deploy recente?** Se sim e o sintoma começou junto, fazer rollback primeiro e
   investigar depois ([deploy.md](./deploy.md#rollback)).
5. **Nunca** executar `docker compose down -v`, `docker volume rm` ou apagar
   `db_data`/`uploads_data` como mitigação.

| Severidade | Critério | Resposta |
|---|---|---|
| SEV1 | Site fora do ar ou checkout indisponível para todos; risco de perda de dados | Imediata; rollback se houver deploy recente |
| SEV2 | Funcionalidade importante degradada (lentidão grave, eventos parados, admin sem upload) | Mesmo dia |
| SEV3 | Problema pontual com contorno | Próximo sprint |

## 1. Site inacessível (gateway)

**Sintomas:** navegador não conecta em `https://localhost:8443`; `gateway` `unhealthy` ou parado.

```bash
docker compose ps gateway
docker compose logs --tail 100 gateway
docker compose exec gateway nginx -t        # sintaxe da configuração
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/nginx-health
```

| Causa provável | Mitigação |
|---|---|
| Porta 8080/8443 ocupada por outro processo | Liberar a porta ou ajustar `NGINX_HTTP_PORT`/`NGINX_HTTPS_PORT` no `.env` e `docker compose up -d gateway` |
| Erro de configuração após mudança | Reverter a mudança em `infra/nginx` e rebuild do gateway |
| Upstream não resolvido (serviço não existe na rede) | Subir os serviços dependentes; verificar `docker compose ps` |
| Certificado ausente/corrompido | Remover o volume `gateway_certs` (só ele) e reiniciar o gateway, que gera um novo autoassinado |

**Verificar:** `/nginx-health` 200, home carrega, `GET /api/obras` 200.

## 2. Erros 502/504 em `/api/*`

**Sintomas:** gateway responde 502/504 para um prefixo (ex.: só `/api/pedidos`).

```bash
docker compose ps auth-service catalog-service order-service
docker compose logs --tail 200 <serviço>
docker compose exec <serviço> wget -qO- http://127.0.0.1:<porta>/health
```

| Causa provável | Mitigação |
|---|---|
| Serviço reiniciando em loop (env inválida: Joi falha no boot) | Ler a primeira linha de erro; corrigir `.env` (ex.: `JWT_SECRET` com menos de 32 caracteres) e `docker compose up -d <serviço>` |
| Migration falhou no boot | Ver erro no log; se veio de deploy, rollback de imagem; nunca editar migration já aplicada |
| Serviço sem conexão com banco | Ir para o item 4 |
| Processo travado (504 após 30 s) | `docker compose restart <serviço>`; coletar `/metrics` (event loop lag) antes, se possível |

## 3. Checkout retorna 503 "Catálogo indisponível"

**Sintomas:** `POST /api/pedidos` com 503; catálogo pode ou não estar acessível ao usuário.

```bash
docker compose ps catalog-service
docker compose logs --since 10m order-service | grep -iE 'circuit|catalog|retry'
docker compose exec order-service wget -qO- "http://catalog-service:3002/api/obras/lote?ids=1"
```

| Causa provável | Mitigação |
|---|---|
| catalog-service fora do ar | Recuperar o catálogo (item 2). O circuito volta a fechar sozinho ~10 s após o catálogo responder |
| Catálogo lento (> 2 s) | Verificar banco e Redis do catálogo; o circuito protege o order-service enquanto isso |
| Circuito "preso" aberto após o catálogo voltar | Aguardar o half-open (10 s); se persistir, `docker compose restart order-service` |

**Verificar:** checkout de teste com `Idempotency-Key` novo retorna 201; logs mostram o circuito `close`.
Comunicar aos usuários que o catálogo segue navegável e a compra pode ser repetida.

## 4. Banco (MariaDB) indisponível

**Sintomas:** `/health` dos serviços com `database: down`; 500/503 em várias rotas.

```bash
docker compose ps mariadb
docker compose logs --tail 100 mariadb
docker compose exec mariadb healthcheck.sh --connect --innodb_initialized && echo OK
docker system df          # disco cheio é causa comum
```

| Causa provável | Mitigação |
|---|---|
| Container parado/reiniciando | `docker compose up -d mariadb`; os serviços reconectam (TypeORM tenta 10x a cada 3 s; depois o restart do container assume) |
| Disco cheio | Liberar espaço (imagens antigas: `docker image prune`); **não** apagar volumes |
| Recuperação InnoDB demorada após crash | Aguardar o healthcheck; acompanhar o log |
| Credenciais trocadas no `.env` após o volume existir | Os usuários são criados só na primeira inicialização: restaurar os valores antigos ou ajustar os grants manualmente |

**Restauração de backup** (último recurso, com decisão registrada):
`docker compose exec -T mariadb sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD"' < backup.sql`.

## 5. Redis indisponível

**Sintomas:** logs `warn` de cache; todas as respostas com `X-Cache: MISS`; eventos param
(`total_gasto`/`total_vendido` não mudam).

```bash
docker compose ps redis
export $(grep -E '^REDIS_PASSWORD=' .env | xargs)
docker compose exec -T redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning ping
docker compose exec -T redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning info memory | grep used_memory_human
```

| Causa provável | Mitigação |
|---|---|
| Container parado | `docker compose up -d redis`; ioredis reconecta sozinho (backoff até 5 s) |
| Memória cheia | Verificar chaves grandes (`--bigkeys`); como é cache, `FLUSHDB` é seguro para chaves `catalog:*`/`orders:*` |

**Impacto conhecido:** eventos publicados enquanto o Redis estava fora foram perdidos.
Após a recuperação, comparar `total_gasto` com a soma dos pedidos do usuário se houver
reclamação (correção manual registrada no Jira).

## 6. Eventos não processados (contadores desatualizados)

**Sintomas:** pedido criado, mas `totalGasto` do usuário ou `totalVendido` da obra não mudou.

```bash
docker compose logs --since 30m order-service | grep 'Evento publicado'
docker compose logs --since 30m auth-service catalog-service | grep -E 'Evento (recebido|processado)|Falha ao processar'
```

| Causa provável | Mitigação |
|---|---|
| Consumidor estava fora do ar na publicação (Pub/Sub não guarda) | Correção pontual: recalcular a partir de `kumoko_orders.pedidos` e registrar; evolução no backlog (Streams/Outbox) |
| `Falha ao processar evento` com erro | Corrigir a causa (ex.: banco do consumidor fora); republicar o envelope original com o mesmo `id` (idempotente) |
| Publicação não aconteceu | Verificar erro no order-service logo após `Pedido criado` |

## 7. Login bloqueado (429) ou falhando

```bash
docker compose logs --since 10m gateway | grep '"status":"\?429'
docker compose logs --since 10m auth-service | grep -iE 'throttl|login'
```

- 429 legítimo (força bruta): manter; o limite expira em 1 minuto.
- Usuários atrás do mesmo IP (ex.: laboratório) sendo bloqueados: ajustar a zona `auth_limit`
  no gateway em mudança registrada.
- Todos os logins com 401 após um deploy: `JWT_SECRET` divergente entre serviços ou
  admin não semeado — conferir `.env` e o log de boot do auth-service.

## 8. Upload de capa/página falhando

| Sintoma | Causa | Ação |
|---|---|---|
| 413 no gateway | Arquivo > 10 MB | Esperado; limite do serviço é 5 MB |
| 400 "tipo de arquivo" | Extensão ou magic bytes inválidos | Esperado; aceitar só jpg/png/webp reais |
| 500 ao gravar | Volume `uploads_data` cheio ou sem permissão | `docker compose exec catalog-service df -h /app/uploads`; liberar espaço |
| Imagem 404 em `/files/...` | Gateway sem o volume montado | Conferir montagem RO em `/var/www/uploads` |

## 9. Encerramento e pós-incidente

1. Confirmar recuperação: `docker compose ps` todo `healthy`, `bash scripts/smoke-test.sh` verde.
2. Atualizar o Bug no Jira com linha do tempo (UTC), causa raiz, impacto (requisições
   afetadas, budget consumido — ver [slo-sli.md](./slo-sli.md)) e ações.
3. Post-mortem sem culpados para SEV1/SEV2, com ações preventivas viradas em issues.
4. Nunca colar segredos, tokens, cookies ou CPF no ticket.

### Modelo de post-mortem

```markdown
## Incidente KUM-___ — <título>
- Severidade / duração / serviços afetados:
- Linha do tempo (UTC): detecção, mitigação, resolução
- Causa raiz:
- Impacto (requisições com erro, pedidos afetados, error budget consumido):
- O que funcionou / o que não funcionou:
- Ações (issue, responsável, prazo):
```
