# @kumoko/observability

Logs estruturados, correlacao e metricas.

| Pasta | Conteudo |
|---|---|
| `observability.module.ts` | `ObservabilityModule.forRoot({ serviceName })`: nestjs-pino + middlewares de contexto e metricas + `GET /metrics`. |
| `logging/` | `buildPinoParams()`: JSON, `service` em todo log, `reqId` (header `X-Request-Id` ou UUID, devolvido na resposta), redacao de `authorization`, `cookie`, senhas e tokens. `pino-pretty` apenas com `NODE_ENV=development`. |
| `request-context/` | `getRequestId()` (AsyncLocalStorage; `undefined` fora de request/evento), `runWithRequestContext()`, `resolveRequestId()`. |
| `metrics/` | `MetricsService` (prom-client: metricas padrao + histograma `http_request_duration_seconds{method,route,status_code,service}`), `MetricsController`. |

Para propagar a correlacao em chamadas HTTP entre servicos: `headers: { 'X-Request-Id': getRequestId() }`.
