# Kumoko Scan - Backend (monorepo NestJS)

Tres microsservicos NestJS 12 (Express) que compartilham cinco bibliotecas internas.
Cada servico tem banco MariaDB proprio; cache e eventos passam pelo Redis.

| App | Porta | Responsabilidade | Swagger |
|---|---|---|---|
| `auth-service` | 3001 | Identidade e acesso (cadastro, login, perfil) | `/api/auth/docs` |
| `catalog-service` | 3002 | Catalogo e leitura (obras, capitulos, paginas, capas) | `/api/catalog/docs` |
| `order-service` | 3003 | Vendas (pedidos, historico) | `/api/orders/docs` |

Todos expoem `GET /health` e `GET /metrics` fora do prefixo `/api` (uso interno: Docker e Prometheus).

## Estrutura

```
backend/
├── apps/
│   ├── auth-service/      src/main.ts, src/auth-service.module.ts, src/config/env.validation.ts, src/modules/...
│   ├── catalog-service/   idem + seed/covers/*.jpg (capas do seed)
│   └── order-service/     idem
├── libs/
│   ├── common/            bootstrapService, AllExceptionsFilter, env (Joi), TypeORM, HealthModule, paginacao
│   ├── security/          guards JWT/roles, decorators, cookie, senhas, uploads, throttling, helmet/CORS
│   ├── observability/     nestjs-pino, request id (getRequestId), metricas Prometheus
│   ├── cache/             RedisModule (REDIS_CLIENT/REDIS_SUBSCRIBER) e CacheService (cache-aside)
│   └── messaging/         EventBus (Redis Pub/Sub) e contratos de eventos
├── jest/                  transformer do Jest para pacotes ESM-only (NestJS 12) no Node 22
├── Dockerfile             multi-stage, ARG APP=<app>
├── nest-cli.json          monorepo (apps com webpack: true)
├── webpack.config.js      aliases @kumoko/* para o build
└── tsconfig.json          paths @kumoko/*
```

Cada lib tem um `README.md` com a API publica. Imports sempre pelo alias (`import { CacheService } from '@kumoko/cache'`).
Os aliases estao declarados em tres lugares que devem ficar em sincronia: `tsconfig.json` (paths),
`webpack.config.js` (build) e `package.json` > `jest.moduleNameMapper` (testes).

Organizacao de cada modulo de dominio (dentro de `apps/<app>/src/modules/<modulo>/`):
`controllers/`, `services/`, `dto/`, `entities/`, `domain/`, `repositories/`, `events/`, `mappers/`.
Migrations ficam em `apps/<app>/src/database/migrations/` e sao importadas explicitamente
(o build e webpack; glob de arquivos nao funciona).

## Requisitos

- Node.js >= 22.12 (testado com 22.14) e npm 10
- MariaDB 11 e Redis 7 (via Docker Compose na raiz do repositorio ou instalados localmente)

## Rodando localmente

```bash
cd backend
npm install

# Variaveis: copie o exemplo de cada app e ajuste host/senhas
cp apps/auth-service/.env.example apps/auth-service/.env
cp apps/catalog-service/.env.example apps/catalog-service/.env
cp apps/order-service/.env.example apps/order-service/.env

# Banco e Redis de desenvolvimento (exemplo com Docker)
docker run -d --name kumoko-dev-mariadb -e MARIADB_ROOT_PASSWORD=root -p 3306:3306 mariadb:11.4
docker run -d --name kumoko-dev-redis -p 6379:6379 redis:7.4-alpine redis-server --requirepass troque-redis

# Um terminal por servico (watch mode)
npm run start:dev:auth-service
npm run start:dev:catalog-service
npm run start:dev:order-service
```

O `ConfigModule` le `apps/<app>/.env` e depois `backend/.env` (o primeiro valor encontrado vence;
variaveis reais do ambiente tem prioridade). As variaveis sao validadas com Joi no boot: se faltar
algo, o servico nao sobe e lista o que esta invalido. Com `NODE_ENV=development` os logs saem
formatados pelo `pino-pretty`; nos demais ambientes saem em JSON.

Os bancos de cada servico (`kumoko_auth`, `kumoko_catalog`, `kumoko_orders`) e seus usuarios sao
criados pelo script `infra/mariadb/init/01-create-databases.sh` quando se usa o Docker Compose da raiz.

## Build e producao

```bash
npm run build                   # os tres apps -> dist/apps/<app>/main.js
npm run build:catalog-service   # apenas um app
npm run start:prod:catalog-service
```

Imagem Docker (contexto = pasta `backend/`):

```bash
docker build --build-arg APP=order-service -t kumoko/order-service .
```

A imagem roda como usuario `node`, com `NODE_ENV=production`, apenas dependencias de producao,
`/app/uploads` gravavel e as capas de seed em `/app/seed/covers`.

## Qualidade

```bash
npm test            # Jest (unitarios + integracao das libs com @nestjs/testing e supertest)
npm run test:cov    # cobertura em coverage/
npm run lint        # ESLint (typescript-eslint type-aware; proibe console.*)
npm run format      # Prettier
npm run typecheck   # tsc --noEmit
```

Testes ficam ao lado do codigo (`*.spec.ts`). Use `@nestjs/testing` normalmente; `jest.mock()` funciona
(inclusive para `axios`). Os pacotes do NestJS 12 sao ESM-only: no Node 22 o Jest os converte para
CommonJS via `jest/esm-to-cjs.transformer.js` (no Node >= 24.9 isso seria nativo).

## Convencoes

- Toda rota exige JWT por padrao; use `@Public()` para liberar e `@Roles('admin')` para restringir.
- Logs apenas via `Logger` do Nest (pino). Nada de `console.log`.
- Erros de dominio viram excecoes HTTP (400/401/403/404/409/422/503); 500 nunca expoe detalhes.
- JSON de resposta em camelCase; colunas no banco em snake_case; DECIMAL com `decimalTransformer`.
