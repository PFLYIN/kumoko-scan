# Documentação do Kumoko Scan

Documentação arquitetural, operacional e de gestão da versão **1.0.0** (microsserviços).
Visão geral do produto e instruções de execução estão no [README da raiz](../README.md).

## Estrutura

```
docs/
├── arquitetura/
│   ├── c4.md                         C4 Contexto, Containers, Componentes e checkout
│   ├── ddd.md                        Subdomínios, Bounded Contexts, Context Map, modelo tático
│   ├── quality-scenarios.md          Cenários de atributos de qualidade
│   ├── boas-praticas.md              Módulos, DTOs, services, controllers, logs, erros
│   └── adr/                          Registro de decisões (ADR-000 a ADR-006)
├── api/
│   └── openapi.yaml                  Contrato OpenAPI 3.1 de todos os endpoints
├── operacao/
│   ├── slo-sli.md                    SLIs, SLOs e error budget
│   ├── resiliencia.md                Retry, timeout, circuit breaker, fallback, idempotência
│   ├── observabilidade.md            Logs, request-id, métricas, consultas
│   ├── cache-e-mensageria.md         Demonstração de cache-aside e Pub/Sub
│   ├── deploy.md                     Pipeline CI/CD, estratégia de deploy e rollback
│   └── runbook.md                    Runbook de incidentes
└── gestao/
    ├── cynefin.md                    Classificação Cynefin e abordagem
    ├── backlog.md                    Product Backlog, User Stories, sprints, versões
    ├── jira.md                       Uso do Jira (workflow, tipos, convenções)
    └── jira-import.csv               Issues importáveis (épicos, stories, tasks, bugs)
```

## Mapa da rubrica

| Item da rubrica | Onde está |
|---|---|
| **Documentação Arquitetural** — diagramas C4 (Contexto e Containers) | [arquitetura/c4.md](./arquitetura/c4.md) |
| Registro de ADRs com decisões principais (monólito vs modulith vs microsserviços) | [ADR-001](./arquitetura/adr/ADR-001-microsservicos.md) e [pasta adr/](./arquitetura/adr/) |
| Quality Scenarios | [arquitetura/quality-scenarios.md](./arquitetura/quality-scenarios.md) |
| **Estilos Arquiteturais e DDD** — Context Map, domínios e subdomínios | [arquitetura/ddd.md §2 e §4](./arquitetura/ddd.md) |
| Definição de Bounded Contexts | [arquitetura/ddd.md §3](./arquitetura/ddd.md) |
| Entities, Value Objects e Aggregates (pelo menos 1 contexto) | [arquitetura/ddd.md §5–§7](./arquitetura/ddd.md) (Vendas, Catálogo e Identidade) |
| **Integração, APIs e Dados** — OpenAPI/Swagger com os principais endpoints | [api/openapi.yaml](./api/openapi.yaml) + Swagger vivo em `/api/auth/docs`, `/api/catalog/docs`, `/api/orders/docs` |
| ADR justificando a escolha do banco | [ADR-002](./arquitetura/adr/ADR-002-banco-mariadb-por-servico.md) |
| **Qualidade, Resiliência e Observabilidade** — SLOs/SLIs | [operacao/slo-sli.md](./operacao/slo-sli.md) |
| Estratégias de resiliência (retry, timeout, circuit breaker) | [operacao/resiliencia.md](./operacao/resiliencia.md) |
| Plano de observabilidade (métricas e logs) | [operacao/observabilidade.md](./operacao/observabilidade.md) |
| **Entrega Contínua** — pipeline CI/CD (build, test, deploy) | `.github/workflows/ci.yml` + [operacao/deploy.md §1](./operacao/deploy.md) |
| Estratégia de deploy (rolling + rollback; blue/green como evolução) | [operacao/deploy.md §2–§3](./operacao/deploy.md) |
| Runbook de incidentes | [operacao/runbook.md](./operacao/runbook.md) |
| **Cache distribuído com Redis** (cache-aside, TTL, invalidação) | [ADR-003](./arquitetura/adr/ADR-003-redis-cache-e-pubsub.md) + [operacao/cache-e-mensageria.md §1](./operacao/cache-e-mensageria.md) + `scripts/demo-cache.sh` |
| **Mensageria** (Redis Pub/Sub, logs comprovando circulação) | [operacao/cache-e-mensageria.md §2](./operacao/cache-e-mensageria.md) + `scripts/demo-events.sh` |
| **Docker Compose + Nginx proxy reverso** | `docker-compose.yml`, `infra/nginx/` + [ADR-004](./arquitetura/adr/ADR-004-nginx-gateway.md) |
| **Boas práticas** (módulos, DTOs, services, controllers; logs; erros) | [arquitetura/boas-praticas.md](./arquitetura/boas-praticas.md) + [ADR-005](./arquitetura/adr/ADR-005-nestjs-monorepo.md) |
| **Gestão via Jira** (stories/tasks/bugs, atribuições, status) | [gestao/jira.md](./gestao/jira.md) + [gestao/jira-import.csv](./gestao/jira-import.csv) |
| **Cynefin** (classificação e abordagem) | [gestao/cynefin.md](./gestao/cynefin.md) |
| **Ciclo de vida ágil** — Product Backlog priorizado com User Stories e critérios de aceite | [gestao/backlog.md](./gestao/backlog.md) |
| Padronização de versões para lançamentos parciais | [gestao/backlog.md §6](./gestao/backlog.md#6-versionamento-e-lançamentos-parciais) + [CHANGELOG.md](../CHANGELOG.md) |

## ADRs

| ADR | Decisão | Status |
|---|---|---|
| [ADR-000](./arquitetura/adr/ADR-000-template.md) | Modelo de ADR | — |
| [ADR-001](./arquitetura/adr/ADR-001-microsservicos.md) | Monólito Express → 3 microsserviços NestJS | Aceito |
| [ADR-002](./arquitetura/adr/ADR-002-banco-mariadb-por-servico.md) | MariaDB 11.4, um database por serviço | Aceito |
| [ADR-003](./arquitetura/adr/ADR-003-redis-cache-e-pubsub.md) | Redis para cache-aside e Pub/Sub | Aceito |
| [ADR-004](./arquitetura/adr/ADR-004-nginx-gateway.md) | Nginx como gateway único | Aceito |
| [ADR-005](./arquitetura/adr/ADR-005-nestjs-monorepo.md) | NestJS em monorepo com libs compartilhadas | Aceito |
| [ADR-006](./arquitetura/adr/ADR-006-autenticacao-jwt-cookie.md) | JWT em cookie httpOnly + Bearer | Aceito |

## Convenções desta documentação

- Diagramas em Mermaid (renderizados pelo GitHub e pelo VS Code).
- Nomes de serviços, portas, rotas, tabelas, eventos e variáveis de ambiente são os
  mesmos do código e do `docker-compose.yml`. Se divergirem, o código e o
  [OpenAPI](./api/openapi.yaml) prevalecem e a documentação deve ser corrigida.
- **Metas x medições:** SLOs e cenários de qualidade trazem metas. Valores medidos só
  entram com data e método (ver [slo-sli.md §6](./operacao/slo-sli.md)).
- Validar o OpenAPI: `npx --yes @redocly/cli@1.34.3 lint docs/api/openapi.yaml`.
