# Plano de observabilidade

Objetivo: conseguir responder, só com o que o sistema emite, a três perguntas — **está
funcionando?** (métricas e healthchecks), **o que aconteceu com esta requisição?**
(logs correlacionados) e **onde está o gargalo?** (latência por serviço e rota).

## 1. Pilares implementados

| Pilar | Implementação | Onde ver |
|---|---|---|
| Logs estruturados | `nestjs-pino` em JSON (`@kumoko/observability`); log de acesso JSON no Nginx | `docker compose logs <serviço>` |
| Correlação | `X-Request-Id` gerado/propagado pelo gateway; `genReqId` reaproveita o header; repassado ao catálogo pelo `CatalogClient`; vira `correlationId` no envelope dos eventos; aparece no corpo de todo erro (`requestId`) | Logs de todos os containers |
| Métricas | `prom-client`: métricas padrão do processo + histograma `http_request_duration_seconds{method,route,status_code,service}` | `GET /metrics` (somente rede interna) |
| Saúde | `GET /health` (terminus: banco e Redis), `/nginx-health` no gateway; healthchecks no Compose | `docker compose ps` |
| Rastreamento distribuído | **Não implementado** (OpenTelemetry é evolução); a correlação por `X-Request-Id` cobre o caso de uso principal | — |

## 2. Logs

### Campos

| Campo | Exemplo | Origem |
|---|---|---|
| `level` | `30` (info), `40` (warn), `50` (error) | pino |
| `time` | epoch ms | pino |
| `service` | `order-service` | `customProps` |
| `req.id` | `3f1c2a9e-...` | `X-Request-Id` |
| `req.method`, `req.url`, `res.statusCode`, `responseTime` | `POST /api/pedidos 201 84` | log automático de requisição |
| `context` | `PedidosService` | Logger do Nest |
| `msg` | `Pedido criado pedidoId=12 usuarioId=3 total=89.70` | aplicação |

Campos **redigidos** antes de gravar: `req.headers.authorization`, `req.headers.cookie`,
qualquer `*.senha*` e `*.password*`. CPF e hash de senha nunca são logados.

### Mensagens de fluxo padronizadas

| Serviço | Mensagem | Quando |
|---|---|---|
| todos | `Evento publicado type= id= channel= source=` | `EventBus.publish` |
| todos | `Evento recebido type= id= source= correlationId=` / `Evento processado` / `Falha ao processar evento` | listeners |
| catalog, order | `Cache HIT key=` / `Cache MISS key= ttl=` / `Cache INVALIDATE prefix= removidas=N` | `CacheService` |
| catalog, order | warn de falha do Redis com fallback ao loader | Redis indisponível |
| order | `Pedido criado pedidoId= usuarioId= total=` | checkout concluído |
| order | estado do circuit breaker (open / halfOpen / close) | `CatalogClient` |
| catalog | quantidade de obras criadas pelo seed | boot com `SEED_CATALOG=true` |
| auth | criação/atualização do administrador a partir de `ADMIN_*` | boot |

### Níveis

- `error`: exceção não tratada (5xx), falha ao processar evento.
- `warn`: fallback de cache, retry no catálogo, circuito aberto, 4xx relevantes de segurança (ex.: 403).
- `info`: fluxo de negócio e ciclo de vida (boot, migrations, seed, eventos).
- `debug`: detalhes para desenvolvimento (`LOG_LEVEL=debug`).

### Consultas úteis

```bash
# Seguir uma requisição de ponta a ponta
docker compose logs --no-log-prefix gateway auth-service catalog-service order-service \
  | grep '<request-id>'

# Circulação de eventos
docker compose logs -f auth-service catalog-service order-service | grep -E 'Evento (publicado|recebido|processado)|Falha ao processar'

# Comportamento do cache
docker compose logs -f catalog-service order-service | grep -E 'Cache (HIT|MISS|INVALIDATE)'

# Erros nas últimas 2 horas
docker compose logs --since 2h order-service | grep '"level":50'
```

## 3. Métricas

### O que coletar

| Métrica | Tipo | Labels | Uso |
|---|---|---|---|
| `http_request_duration_seconds` | histograma | `method`, `route`, `status_code`, `service` | Latência (p50/p95/p99), vazão e taxa de erro — base dos SLIs |
| `process_cpu_seconds_total`, `process_resident_memory_bytes` | padrão | — | Saturação |
| `nodejs_eventloop_lag_seconds` | padrão | — | Event loop bloqueado (ex.: bcrypt, imagens grandes) |
| `nodejs_heap_size_used_bytes` | padrão | — | Vazamento de memória |
| Healthcheck do container | Docker | serviço | Prontidão (SLI-7) |
| `request_time`, `upstream_response_time`, `status` | log do Nginx | upstream | Latência vista pelo usuário e erros da borda |

Métricas candidatas para a próxima versão (não implementadas): contadores
`cache_requests_total{result="hit|miss|error"}`, `events_published_total{type}`,
`events_processed_total{type,result}` e gauge `circuit_breaker_state`. Hoje esses
dados são extraídos dos logs.

### Como consultar hoje

`/metrics` não é exposto pelo gateway (de propósito). Dentro da rede:

```bash
docker compose exec order-service wget -qO- http://127.0.0.1:3003/metrics | grep -E '^http_request_duration_seconds_(count|sum)'
docker compose exec catalog-service wget -qO- http://127.0.0.1:3002/health
```

### Evolução: Prometheus + Grafana

Adicionar ao Compose (perfil `observability`) um Prometheus com `scrape_configs` para
`auth-service:3001`, `catalog-service:3002`, `order-service:3003` em `/metrics`, e um
Grafana com painéis: tráfego por serviço, p95 por rota, taxa de 5xx, budget restante dos
SLOs ([`slo-sli.md`](./slo-sli.md)). Logs podem ir para Loki com o driver do Docker.

## 4. Painel mínimo (o que olhar primeiro)

1. `docker compose ps` — algum container `unhealthy` ou reiniciando?
2. Taxa de 5xx no log do gateway nos últimos 15 min.
3. p95 do catálogo e do checkout (`/metrics`).
4. Logs `warn`/`error` de order-service (circuito, Redis) e de eventos com falha.

O que fazer a partir daí está no [runbook](./runbook.md).
