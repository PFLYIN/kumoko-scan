# Changelog

Todas as mudanças relevantes do Kumoko Scan são registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o
projeto adota o [Versionamento Semântico](https://semver.org/lang/pt-BR/). As versões
0.x foram reconstruídas a partir do histórico do Git (não havia tags na época);
convenções de versão em [`docs/gestao/backlog.md`](docs/gestao/backlog.md#6-versionamento-e-lançamentos-parciais).

## [Não lançado]

### Planejado
- Prometheus e Grafana com painéis de SLO (v1.1.0).
- Entrega garantida de eventos com Redis Streams ou Outbox (v1.2.0).
- Tag de imagem por versão SemVer no workflow de publicação.

## [1.0.0] - 2026-11-14

Reestruturação completa em microsserviços. **Quebra de compatibilidade** com a API
Express (rotas, formatos JSON e banco de dados novos).

### Adicionado
- Monorepo NestJS em `backend/` com `auth-service` (:3001), `catalog-service` (:3002) e
  `order-service` (:3003), e libs `@kumoko/common`, `@kumoko/security`,
  `@kumoko/observability`, `@kumoko/cache` e `@kumoko/messaging`.
- Gateway Nginx (`infra/nginx`) como única porta de entrada: HTTPS com certificado
  autoassinado gerado na subida, cabeçalhos de segurança, rate limit, `X-Request-Id` e
  log de acesso em JSON; arquivos servidos em `/files/`.
- Docker Compose com healthchecks, `depends_on: service_healthy`, `restart: unless-stopped`
  e rede `kumoko_net`; só o gateway publica portas (8080/8443).
- MariaDB 11.4 com um database e um usuário por serviço; migrations TypeORM versionadas.
- Cache-aside no Redis com TTL e invalidação por prefixo; header `X-Cache: HIT|MISS`.
- Eventos em Redis Pub/Sub: `order.completed`, `catalog.obra.updated`,
  `catalog.obra.deleted`, `user.registered`, com consumidores idempotentes.
- Aggregate `Pedido` com value objects `Dinheiro`, `Quantidade` e `ObraRef`; checkout
  idempotente via `Idempotency-Key`.
- `CatalogClient` com timeout, retry com backoff exponencial e circuit breaker (opossum).
- Logs JSON (pino) com redação de dados sensíveis e métricas Prometheus
  (`http_request_duration_seconds`) em `/metrics`.
- Swagger por serviço (`/api/auth/docs`, `/api/catalog/docs`, `/api/orders/docs`) e
  contrato consolidado OpenAPI 3.1 em `docs/api/openapi.yaml`.
- Seed do catálogo com as capas de exemplo e provisionamento do administrador por `ADMIN_*`.
- Novo frontend React 19 + Vite 7 + Tailwind v4: catálogo com filtros, leitor de
  capítulos, carrinho, checkout, histórico de pedidos, perfil e painel do acervo.
- Pipeline GitHub Actions: lint, testes, build, smoke test com Compose, publicação de
  imagens no GHCR e deploy esqueleto.
- Scripts `scripts/demo-cache.sh`, `scripts/demo-events.sh` e `scripts/smoke-test.sh`.
- Documentação em `docs/`: C4, ADRs 000–006, DDD e Context Map, quality scenarios,
  SLO/SLI, resiliência, observabilidade, deploy, runbook, Cynefin, backlog e Jira.

### Alterado
- Tabelas `mangas`, `livros` e `novels` unificadas em `obras` com campo `tipo`.
- Compras passam a ser `pedidos` + `itens_pedido` com snapshot de nome e preço.
- Sessão web por cookie httpOnly `kumoko_token` (antes token em `localStorage`).
- Senhas com `bcryptjs` custo 12 e política mínima de 8 caracteres com letra e número.
- Erros no formato único `{ statusCode, error, message, path, timestamp, requestId }`.

### Removido
- API Express (`Kumoko_Scan-Back`) e protótipo NestJS (`kumoko-backend`) como código ativo.
- `sequelize.sync({ alter: true })` no boot (substituído por migrations).

### Corrigido
- Rota de páginas do capítulo retornava apenas uma página.
- Tailwind não era aplicado no frontend.
- URLs da API e das imagens fixas no código do frontend.
- Rotas do frontend que levavam a telas inexistentes; adicionada página 404.
- `.env.example` com host de banco diferente do serviço do Compose.

### Segurança
- Cadastro público não concede mais papel de administrador (antes bastava usar um e-mail fixo).
- Removido o segredo JWT de fallback; `JWT_SECRET` obrigatório com no mínimo 32 caracteres.
- Preço e total do pedido calculados no servidor a partir do catálogo (antes vinham do cliente).
- Banco e serviços não ficam mais expostos no host.
- Upload valida o conteúdo do arquivo (magic bytes), não só a extensão.
- Erros 5xx não expõem mensagens internas.

## [0.4.0] - 2026-11-12

### Adicionado
- Protótipo NestJS (`kumoko-backend`) e testes de integração.
- Auditoria técnica do projeto e documentação inicial (ADRs, OpenAPI, backlog).

### Alterado
- App mobile movido para `archive/mobile` (somente referência).

### Segurança
- Chave privada TLS removida do índice do Git e padrões de segredos adicionados ao `.gitignore`.

## [0.3.0] - 2026-09-17

### Adicionado
- App mobile React Native/Expo com catálogo, detalhes, carrinho, histórico de compras e
  tela de gerenciamento do acervo para administradores.
- Rotas administrativas usadas pelo mobile.
- Diagramas Mermaid (DER, casos de uso, atividades, sequência) no README.

## [0.2.0] - 2026-09-14

### Adicionado
- E-commerce: cadastro com validação de CPF, login JWT, carrinho, finalização de compra
  e histórico.
- Painel do administrador ("Mestre das Sombras") com cadastro de obras e upload de capas (Multer).

### Corrigido
- Integração de autenticação e navegação entre frontend e API.

## [0.1.0] - 2026-06-25

### Adicionado
- Estrutura inicial: site React + Vite e API Express/TypeScript com Sequelize e MariaDB.
- Catálogo online de mangás e livros com capas.
- Nginx com cabeçalhos de segurança e CSP; `.env.example`.
- Testes e2e de perfil (Jest + Supertest).

### Corrigido
- Imports do Sequelize, roteamento do Express e tela branca na edição de obras.
