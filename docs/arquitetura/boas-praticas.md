# Boas práticas do backend

Padrões aplicados nos três serviços NestJS (`backend/apps/*`) e nas libs
`@kumoko/*`. Este documento cobre o item da rubrica "módulos, DTOs, services,
controllers; logs; tratamento de erros".

## 1. Organização por módulo

Cada serviço é um app do monorepo Nest; cada capacidade de negócio é um módulo:

```
backend/apps/order-service/src/
├── main.ts                          # bootstrapService(OrderServiceModule, {...})
├── order-service.module.ts          # importa libs e módulos de negócio
├── config/env.validation.ts         # schema Joi (falha rápida no boot)
├── database/
│   ├── data-source.ts
│   └── migrations/<timestamp>-<nome>.ts
└── modules/
    ├── pedidos/
    │   ├── pedidos.module.ts
    │   ├── controllers/pedidos.controller.ts
    │   ├── services/pedidos.service.ts
    │   ├── dto/create-pedido.dto.ts
    │   ├── entities/pedido.entity.ts, item-pedido.entity.ts
    │   ├── domain/pedido.ts, item-pedido.ts, dinheiro.ts, quantidade.ts, obra-ref.ts
    │   ├── repositories/pedido.repository.ts
    │   ├── events/pedido.publisher.ts, catalog-events.listener.ts
    │   └── mappers/pedido.mapper.ts
    └── catalogo/
        └── catalog.client.ts        # Anticorruption Layer para o catalog-service
```

| Camada | Responsabilidade | Não deve |
|---|---|---|
| **Controller** | Rota, verbo, status HTTP, decorators de auth (`@Public`, `@Roles`, `@CurrentUser`), Swagger (`@ApiTags`, `@ApiResponse`) | Conter regra de negócio ou acessar o repositório |
| **DTO** | Contrato de entrada com `class-validator` + `@ApiProperty`; conversão com `class-transformer` | Ser reaproveitado como entidade de banco |
| **Service** | Caso de uso: orquestra domínio, repositório, cache, eventos e clientes HTTP | Montar resposta HTTP ou ler `req` diretamente |
| **Domain** | Aggregates, value objects, erros de domínio (onde há regra rica, como `Pedido`) | Importar Nest, TypeORM ou axios |
| **Entity (TypeORM)** | Mapeamento de tabela (snake_case no banco) | Vazar para a resposta JSON |
| **Mapper** | Entity/aggregate → response DTO (camelCase) | Ter efeitos colaterais |
| **Repository** | Persistência e tradução domínio ↔ banco | Validar regra de negócio |

## 2. Configuração

- Variáveis validadas com Joi (`baseEnvSchema` + extensões por serviço). Sem valor
  padrão para segredos: `JWT_SECRET` com menos de 32 caracteres impede o boot.
- Nenhum segredo hardcoded; `.env` fica fora do Git e `.env.example` documenta tudo.

## 3. Validação e contratos

- `ValidationPipe` global com `whitelist`, `forbidNonWhitelisted` e `transform`:
  campos desconhecidos geram 400 (é isso que impede o cliente de mandar `preco`).
- Paginação padronizada (`PaginationQueryDto`: `page`, `limit` ≤ 50) e envelope
  `Paginated<T>`.
- Swagger por serviço gerado do código e contrato consolidado em
  [`../api/openapi.yaml`](../api/openapi.yaml).

## 4. Tratamento de erros

- `AllExceptionsFilter` global produz sempre
  `{ statusCode, error, message, path, timestamp, requestId }`.
- Mapeamento de erros de domínio para HTTP:

  | Situação | Status |
  |---|---|
  | Validação de DTO, CPF inválido, senha fraca, invariante do pedido | 400 |
  | Sem token, token inválido/expirado, credenciais erradas | 401 |
  | Papel insuficiente | 403 |
  | Recurso inexistente ou pedido de outro usuário | 404 |
  | E-mail/CPF duplicado, número de capítulo/página repetido | 409 |
  | Obra inexistente no checkout | 422 |
  | Limite de requisições | 429 |
  | Catálogo indisponível / circuito aberto | 503 |

- Erros 5xx retornam mensagem genérica; o detalhe (stack) vai apenas para o log com o
  `requestId`.

## 5. Logs

- Somente `Logger` do Nest/pino (sem `console.log`), em JSON, com `service`,
  `req.id` e nível configurável (`LOG_LEVEL`).
- Mensagens de fluxo no formato `Ação chave=valor`, por exemplo:
  `Pedido criado pedidoId=12 usuarioId=3 total=89.70`, `Cache MISS key=catalog:obras:id:3 ttl=60`,
  `Evento publicado type=order.completed id=... channel=kumoko.events.order.completed source=order-service`.
- Redação automática de `authorization`, `cookie`, `senha` e `password`.
- Detalhes em [`../operacao/observabilidade.md`](../operacao/observabilidade.md).

## 6. Segurança no código

- Guard JWT global (negação por padrão), `RolesGuard`, `ThrottlerGuard`.
- `helmet`, CORS restrito a `CORS_ORIGINS`, `trust proxy` (IP real vindo do gateway).
- Uploads: `memoryStorage`, limite de 5 MB, filtro de extensão/mimetype **e** checagem
  de magic bytes; nomes de arquivo gerados (UUID), nunca o nome enviado.
- Senhas com `bcryptjs` custo 12; respostas nunca incluem senha ou CPF.

## 7. Testes

- Jest + ts-jest, arquivos `*.spec.ts` ao lado do código.
- Prioridades: value objects e aggregate `Pedido`, validador de CPF, `CacheService`
  (Redis mockado), guards, `EventBus` (mock), `CatalogClient` (retry e circuit breaker
  com axios mockado), `AuthService` (register/login).
- Smoke test de ponta a ponta em `scripts/smoke-test.sh`, executado na CI após
  `docker compose up --wait`.
