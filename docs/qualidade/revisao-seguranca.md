# Revisão de segurança e corretude

Data: 2026-11-15 · Branch `feature/melhorias-web` · Stack completa em `https://localhost:8443`.

Método: leitura do código (`backend/apps`, `backend/libs`, `frontend/src`, `infra/`, `docker-compose.yml`)
e verificação prática com `curl -k` contra a stack, usando dois clientes recém-cadastrados (A e B) e
requisições anônimas. Para cada hipótese, a evidência abaixo é o resultado observado.

## Achados

| # | Achado / hipótese | Severidade | Evidência | Status | Arquivo |
|---|---|---|---|---|---|
| 1 | IDOR em `GET /api/pedidos/:id` (cliente B lê pedido do cliente A) | Alta (se real) | B → pedido 58 de A: **404** (não revela existência) | Falso positivo | `order-service/.../pedidos.service.ts` (`obter`) |
| 2 | Endpoints admin acessíveis por cliente | Alta (se real) | B → `/api/pedidos/admin/resumo`, `/api/users/admin`, `PATCH /api/users/1/role`, `POST /api/obras`, `DELETE /api/capitulos/1`: **403** | Falso positivo | `@Roles('admin')` nos controllers |
| 3 | Escalada de papel pelo cadastro ou perfil (`role` no corpo) | Alta (se real) | `register` e `PATCH /users/me` com `role`: **400** "O campo role não é permitido" (whitelist + forbidNonWhitelisted) | Falso positivo | `libs/common/src/validation` |
| 4 | Admin rebaixa a si mesmo / remove o último admin | Média | Bloqueado no service (`ROLE_PROPRIO`, `ULTIMO_ADMIN` com lock pessimista) | Falso positivo | `auth-service/.../admin-usuarios.service.ts` |
| 5 | Paginação sem limite | Média | `?limit=100000` em obras e `?limit=1000` em pedidos: **400** (máx. 50) | Falso positivo | DTOs de paginação |
| 6 | SQL injection em busca (LIKE) / ordenação | Alta (se real) | Busca parametrizada com `escaparLike`; ordenação por enum fixo; `?busca=%'` → 200 vazio; `?sort=id;drop` → 400 | Falso positivo | `admin-usuarios.service.ts`, `obras.service.ts` |
| 7 | Upload: path traversal, SVG/HTML, tamanho | Alta (se real) | Nome gerado (`timestamp-uuid.ext`), `resolveInside` confere raiz, MIME+extensão+magic bytes (JPG/PNG/WEBP), 5 MB, 1 arquivo; reprocessado com sharp | Falso positivo | `libs/security/src/uploads`, `file-storage.service.ts` |
| 8 | Traversal em `/files/` (alias do Nginx) | Alta (se real) | `--path-as-is /files/../.env` e `/files../etc/passwd` → SPA (nginx normaliza; `location ^~ /files/` com barra final) | Falso positivo | `infra/nginx/templates/default.conf.template` |
| 9 | `/metrics`, `/health`, Prometheus expostos | Média | `/metrics`, `/api/metrics`, `/metrics/` → 404; apenas o gateway publica portas | Falso positivo | nginx + `docker-compose.yml` |
| 10 | Grafana com anônimo/signup/senha padrão | Média | `GF_AUTH_ANONYMOUS_ENABLED=false`, `GF_USERS_ALLOW_SIGN_UP=false`, senha obrigatória do `.env`; `/grafana/api/dashboards/home` → 401 | Falso positivo | `docker-compose.yml` |
| 11 | CSRF via cookie | Média | Cookie `httpOnly; Secure; SameSite=Strict`; POST `form-urlencoded`/`text/plain` não cria pedido (400) | Falso positivo | `libs/security/src/jwt/auth-cookie.ts` |
| 12 | CORS permissivo | Média | `Origin: https://evil.com` não recebe `Access-Control-Allow-Origin` | Falso positivo | `libs/security/src/http/cors.ts` |
| 13 | Headers/CSP | Média | CSP `script-src 'self'`, HSTS, nosniff, `X-Frame-Options: DENY`, `server_tokens off`, sem `X-Powered-By` | Falso positivo | `snippets/security-headers.conf.template` |
| 14 | Open redirect em `/entrar?redirect=` | Média | `safeRedirect` aceita só caminhos internos (rejeita `//` e `/\`) | Falso positivo | `frontend/src/utils/redirect.js` |
| 15 | XSS no front | Alta (se real) | Nenhum `dangerouslySetInnerHTML`; token não fica em `localStorage` (só cookie httpOnly) | Falso positivo | `frontend/src` |
| 16 | JWT fraco / confusão de algoritmo | Alta (se real) | `JWT_SECRET` mínimo 32 chars (Joi); `algorithms: ['HS256']` | Falso positivo | `libs/security/src/security.module.ts` |
| 17 | Força bruta no login | Média | Nginx `auth_limit` 10 r/min + throttler da aplicação (5/min) — na verificação, o 2º login em rajada do mesmo IP foi recusado | Falso positivo | nginx + `libs/security/src/throttling` |
| 18 | Pedido duplicado / corrida | Média | `Idempotency-Key` com tratamento de corrida; preço vem do catálogo (`preco` no corpo → 400) | Falso positivo | `pedidos.service.ts` |
| 19 | Cache servindo dado de outro usuário | Média | Cache Redis só em dados públicos do catálogo; resumo admin em memória por `dias` (só admin) | Falso positivo | `obras.service.ts`, `pedidos-admin.service.ts` |
| 20 | Dependências vulneráveis | — | `npm audit --omit=dev`: 0 vulnerabilidades (backend e frontend) | Falso positivo | `package-lock.json` |
| 21 | Containers como root | Baixa | Serviços Node rodam com `USER node`; nginx usa workers `nginx` | Falso positivo | `backend/Dockerfile` |
| 22 | `requestId: null` em erro de JSON malformado (body parser roda antes do pino-http) | Baixa | `POST /api/auth/login` com `{bad` → `"requestId":null` (o gateway ainda devolve `X-Request-Id`) | Aceito | `libs/common/src/filters/all-exceptions.filter.ts` |
| 23 | Mensagem do parser JSON ecoada no erro 400 | Baixa | "Expected property name… position 1" — sem stack nem dado interno | Aceito | idem |
| 24 | Carrinho em `localStorage` persiste após logout | Baixa | Itens do carrinho (dados públicos de catálogo) ficam no navegador | Aceito | `frontend/src/contexts/CartContext.jsx` |
| 25 | Swagger público (`/api/*/docs`) | Baixa | 200 sem autenticação; documenta apenas rotas já protegidas | Aceito | `libs/common/src/bootstrap` |

Nenhum achado de severidade média ou maior foi confirmado; por isso não houve alteração de código nesta revisão.

## Riscos aceitos

- **Papel no token só muda no próximo login.** O JWT carrega o `role`; após `PATCH /users/:id/role` o usuário mantém o papel antigo até o token expirar (`JWT_EXPIRES_IN`). Não há revogação/blacklist.
- **Logout não revoga o JWT.** Remove o cookie, mas um token copiado continua válido até expirar.
- **Certificado autoassinado.** Gerado no boot do gateway (`10-generate-certs.sh`); em produção, usar certificado de CA.
- **Progresso de leitura e carrinho locais.** Ficam em `localStorage`, por navegador e não por usuário.
- **Swagger exposto** para fins acadêmicos/demonstração.
- **`requestId` nulo** em erros gerados antes do middleware de log (JSON malformado).
- **Leitura gratuita.** Páginas de capítulos são públicas por regra de negócio; a compra não controla o acesso à leitura.
