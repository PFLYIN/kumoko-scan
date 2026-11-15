# SLOs e SLIs

> **Metas, não medições.** Os valores abaixo são objetivos de projeto definidos para a
> v1.0.0. A coleta contínua é feita pelo Prometheus e exibida no Grafana (painéis de SLO em
> "Kumoko Scan — Visão geral"); sem ela, use amostragem manual (`/metrics`, logs do Nginx e smoke test). Resultados medidos devem
> ser anotados na seção 6 com data e método — não preencher com números estimados.

## 1. Fontes de dados disponíveis

| Fonte | Onde | O que fornece |
|---|---|---|
| Histograma `http_request_duration_seconds{method,route,status_code,service}` | `GET /metrics` de cada serviço (rede interna) | Latência e contagem por rota e status, por serviço |
| Métricas padrão do processo Node (`prom-client` `collectDefaultMetrics`) | idem | CPU, memória, event loop lag, heap |
| Log de acesso JSON do gateway | `docker compose logs gateway` | Status, `request_time`, `upstream_response_time`, upstream e `request_id` de **toda** requisição que chega pela borda (inclui 502/504 gerados pelo próprio Nginx) |
| Healthchecks do Compose | `docker compose ps`, `docker inspect` | Estado `healthy/unhealthy` de cada container (intervalo do healthcheck) |
| Logs de aplicação JSON (pino) | `docker compose logs <serviço>` | `Cache HIT/MISS`, eventos publicados/processados, estado do circuit breaker |

O log do gateway é a fonte preferida para disponibilidade porque enxerga falhas em que
o serviço nem chegou a responder (o histograma do serviço não registra o que ele não
recebeu).

## 2. SLIs

| SLI | Definição (eventos bons / eventos válidos) | Fonte |
|---|---|---|
| **SLI-1 Disponibilidade da API** | Requisições `/api/*` com status < 500 ÷ todas as requisições `/api/*` (exclui 429, que é proteção intencional) | Log do gateway |
| **SLI-2 Latência do catálogo** | Requisições `GET` de `catalog-service` com duração ≤ 250 ms ÷ todas as `GET` de `catalog-service` | Histograma (bucket `le="0.25"`) |
| **SLI-3 Latência do checkout** | `POST /api/pedidos` com duração ≤ 1 s ÷ todas as `POST /api/pedidos` com status < 500 | Histograma do order-service |
| **SLI-4 Sucesso do checkout** | `POST /api/pedidos` com status 2xx ou 4xx ÷ todas as `POST /api/pedidos` | Log do gateway / histograma |
| **SLI-5 Latência do login** | `POST /api/auth/login` com duração ≤ 1 s ÷ todas | Histograma do auth-service (inclui bcrypt custo 12) |
| **SLI-6 Propagação de eventos** | `order.completed` com log `Evento processado` nos dois consumidores em ≤ 5 s ÷ eventos publicados | Logs (mesmo `id` do envelope) |
| **SLI-7 Prontidão dos containers** | Amostras de healthcheck `healthy` ÷ total de amostras, por serviço | Healthcheck do Compose |
| **SLI-8 Eficiência do cache** | `Cache HIT` ÷ (`HIT` + `MISS`) nas chaves `catalog:*` | Logs do catalog-service / header `X-Cache` |

## 3. SLOs (janela móvel de 30 dias)

| SLO | Meta | Error budget (30 dias) | Justificativa |
|---|---|---|---|
| SLO-1 Disponibilidade da API (SLI-1) | **99,5%** | 0,5% das requisições (≈ 3h36min de indisponibilidade total) | Projeto acadêmico em um host único, sem redundância; meta honesta para manutenção planejada |
| SLO-2 Latência do catálogo (SLI-2) | **95%** das leituras ≤ 250 ms | 5% das leituras podem passar de 250 ms | Leitura é o fluxo mais frequente; cache-aside deve manter folga |
| SLO-3 Latência do checkout (SLI-3) | **95%** ≤ 1 s | 5% | Inclui chamada ao catálogo com retry |
| SLO-4 Sucesso do checkout (SLI-4) | **99%** | 1% | 4xx são erros do cliente e não consomem budget; 503 de circuito aberto consomem |
| SLO-5 Latência do login (SLI-5) | **95%** ≤ 1 s | 5% | bcrypt custo 12 é caro de propósito |
| SLO-6 Propagação de eventos (SLI-6) | **99%** em ≤ 5 s | 1% | Pub/Sub sem persistência; perdas consomem o budget |
| SLO-7 Prontidão (SLI-7) | **99,5%** por serviço | 0,5% | Alinhado ao SLO-1 |

SLI-8 (eficiência do cache) é **indicador de acompanhamento**, sem SLO: a meta de
referência é > 80% de HIT nas listagens em horário de uso.

## 4. Consultas

Com Prometheus (serviço `prometheus` do Compose; painéis no Grafana em `/grafana/`), os SLIs ficam (Prometheus 3 grava buckets inteiros como `le="1.0"`):

```promql
# SLI-2: fração de GETs do catálogo em até 250 ms (janela de 30 dias)
sum(rate(http_request_duration_seconds_bucket{service="catalog-service",method="GET",le="0.25"}[30d]))
/
sum(rate(http_request_duration_seconds_count{service="catalog-service",method="GET"}[30d]))

# SLI-3: checkout em até 1 s
sum(rate(http_request_duration_seconds_bucket{service="order-service",method="POST",route=~".*pedidos",le="1.0"}[30d]))
/
sum(rate(http_request_duration_seconds_count{service="order-service",method="POST",route=~".*pedidos",status_code!~"5.."}[30d]))

# Burn rate de disponibilidade (alerta rápido: 1h)
(sum(rate(http_request_duration_seconds_count{status_code=~"5.."}[1h]))
 / sum(rate(http_request_duration_seconds_count[1h]))) / 0.005
```

Os limites `0.25` e `1` correspondem a buckets do histograma (`0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10` segundos); ao alterar
os buckets em `@kumoko/observability`, revisar estas consultas.

Sem Prometheus (observabilidade desligada), amostragem manual:

```bash
# Disponibilidade a partir do log JSON do gateway (últimas N requisições /api)
docker compose logs --no-log-prefix gateway \
  | grep '"uri":"/api' \
  | grep -o '"status":[0-9]*' | grep -o '[0-9]*$' \
  | awk '{t++; if ($1>=500) e++} END {printf "total=%d erros5xx=%d disponibilidade=%.3f%%\n", t, e, 100*(t-e)/t}'

# Histograma bruto de um serviço
docker compose exec catalog-service wget -qO- http://127.0.0.1:3002/metrics \
  | grep http_request_duration_seconds
```

Os campos `uri`, `status`, `request_time` e `request_id` vêm do `log_format json_access`
em `infra/nginx/nginx.conf`.

## 5. Política de error budget

| Budget restante | Ação |
|---|---|
| > 50% | Fluxo normal de entregas |
| 25% – 50% | Toda entrega precisa de smoke test verde e plano de rollback revisado |
| < 25% | Prioridade para itens de confiabilidade no próximo sprint (bugs, testes, resiliência) |
| Esgotado | Congelar features; só correções e melhorias de confiabilidade até recuperar; post-mortem obrigatório para incidentes que consumiram > 10% do budget |

Alertas propostos (quando houver coleta): burn rate > 14,4 em 1h ou > 6 em 6h para o
SLO-1; container `unhealthy` por mais de 2 min; circuito do catálogo aberto por mais de
1 min. Resposta segue o [runbook](./runbook.md).

## 6. Registro de medições

| Data | SLI | Método | Resultado | Observação |
|---|---|---|---|---|
| — | — | — | *ainda não medido* | Preencher após a primeira execução com dados reais |
