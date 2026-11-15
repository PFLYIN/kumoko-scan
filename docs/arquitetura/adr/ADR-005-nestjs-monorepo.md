# ADR-005: NestJS em monorepo (apps + libs compartilhadas)

- **Status:** Aceito
- **Data:** 2026-11-14

## Contexto

O backend legado em Express não tinha padrão de módulos, validação declarativa ou
injeção de dependência; um protótipo NestJS (`kumoko-backend`) já existia sem
paridade. A rubrica cobra organização em módulos, DTOs, services e controllers, logs
e tratamento de erros consistentes. Os três serviços repetiriam muito código de
infraestrutura (bootstrap, segurança, logs, métricas, cache e eventos).

## Decisão

- **NestJS** (versão estável mais recente, mesmo major em todos os `@nestjs/*`),
  plataforma Express, TypeScript com `strictNullChecks`.
- **Monorepo Nest** (`nest-cli.json` com `"monorepo": true`) em `backend/`:
  - `apps/auth-service`, `apps/catalog-service`, `apps/order-service`;
  - libs `@kumoko/common` (bootstrap, filtro de erros, paginação, health, env),
    `@kumoko/security` (guards, decorators, JWT, senhas, uploads),
    `@kumoko/observability` (pino, request-id, Prometheus),
    `@kumoko/cache` (Redis + `CacheService`) e `@kumoko/messaging` (`EventBus` e contratos).
- Um `package.json`/lockfile e **um `Dockerfile` multi-stage** parametrizado por
  `ARG APP`, gerando três imagens independentes.
- Estrutura interna padronizada por módulo: `controllers/`, `services/`, `dto/`,
  `entities/`, `domain/`, `repositories/`, `events/`, `mappers/` (ver
  [`../boas-praticas.md`](../boas-praticas.md)).

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|---|---|---|---|
| Polyrepo (um repositório por serviço) | Independência total de versão | Duplicação de libs ou publicação em registry; mais pipelines | Excesso para uma equipe pequena e um único entregável |
| Express em cada serviço | Conhecido pela equipe | Sem DI, validação e módulos padronizados; mais código manual | Repetiria problemas do legado |
| Nx ou Turborepo | Cache de build, grafo de dependências | Mais uma ferramenta para aprender | O monorepo nativo do Nest é suficiente |
| Fastify como plataforma | Desempenho | Middlewares (multer, cookie-parser, helmet) exigem adaptações | Express basta para a carga esperada |

## Consequências

**Positivas**

- Infraestrutura transversal escrita e testada uma vez; serviços focam no domínio.
- Contratos de eventos tipados e compartilhados em tempo de compilação.
- Swagger gerado do código (`/api/auth/docs`, `/api/catalog/docs`, `/api/orders/docs`).

**Negativas / trade-offs**

- Atualizar uma lib afeta os três serviços (mitigado pelos testes e pela CI única).
- Libs compartilhadas não podem conter regra de negócio, senão os serviços voltam a
  ficar acoplados.
- O build do monorepo usa webpack: migrations precisam ser importadas explicitamente
  (glob de arquivos não funciona no bundle).
- Todos os serviços sobem com as mesmas versões de dependências.

## Revisitar quando

- Um serviço precisar de ciclo de release independente com versões diferentes de libs.
- O tempo de CI crescer a ponto de exigir build incremental (avaliar Nx).
