# @kumoko/common

Infraestrutura comum a todos os microsservicos.

| Pasta | Conteudo |
|---|---|
| `bootstrap/` | `bootstrapService(appModule, opts)` e `runService(appModule, opts)`: prefixo `/api` (exceto `/health` e `/metrics`), helmet, CORS, cookie-parser, trust proxy, `ValidationPipe`, filtro global, logger pino, Swagger em `/api/<docsPath>/docs`, shutdown hooks, listen em `0.0.0.0:PORT`. |
| `filters/` | `AllExceptionsFilter`: corpo de erro `{ statusCode, error, message, path, timestamp, requestId }`; 500 nunca vaza detalhe. |
| `config/` | `baseEnvSchema` (Joi) e `validateEnv(schema)` para o `ConfigModule`. |
| `database/` | `createTypeOrmOptions(migrations, entities)`, `buildDataSourceOptions(env, migrations, entities)` (CLI), `decimalTransformer`, `TypeOrmNestLogger`. |
| `health/` | `HealthModule.register({ checkDatabase, checkRedis })` -> `GET /health` (Terminus: ping no banco + PING no Redis). |
| `pagination/` | `PaginationQueryDto` (page=1, limit=12, max 50), `Paginated<T>`, `paginate()`, `toSkipTake()`. |
