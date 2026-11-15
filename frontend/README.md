# Kumoko Scan - Frontend web

SPA em **React 19 + Vite 7 + React Router 7 + Tailwind CSS v4** que consome os microsserviços
do Kumoko Scan pelo gateway Nginx (`/api/...` e `/files/...`). Ícones com `lucide-react`; sem CDNs
externos (compatível com a CSP do gateway).

## Estrutura

```
src/
  main.jsx, App.jsx
  app/            providers.jsx (Toast > Auth > Cart) e router.jsx (rotas + lazy loading)
  services/       http.js (axios, erros normalizados) e auth/catalog/orders.service.js
  contexts/       AuthContext (sessão via cookie httpOnly), CartContext (localStorage), ToastContext
  hooks/          useAuth, useCart, useToast, useFetch (loading/erro/reload), useDocumentTitle
  components/
    layout/       AppLayout, Header, UserMenu, MobileNav, HeaderSearch, Footer...
    ui/           Spinner, LoadingState, EmptyState, ErrorState, Pagination, ConfirmDialog, FormField...
    obras/        ObraCard, ObraGrid, ObraCover, ObraShelf, ObraFiltros, TipoTabs, TipoBadge
    routing/      ProtectedRoute, AdminRoute, RouteError
  pages/          Home, Catalogo, ObraDetalhes, Leitor, Carrinho, Pedidos, Entrar, Perfil, NotFound
  pages/admin/    Acervo, ObraForm, CapitulosAdmin
  utils/          format.js, cpf.js, validation.js, uuid.js, redirect.js
  styles/         index.css (@import "tailwindcss" + tokens de tema)
```

## Rotas

| Rota | Acesso | Descrição |
|---|---|---|
| `/` | pública | Destaques: mais vendidos e novidades |
| `/catalogo` | pública | Tabs por tipo (`?tipo=`), busca (`?busca=`), ordenação e paginação |
| `/obras/:id` | pública | Detalhes, adicionar ao carrinho, lista de capítulos |
| `/obras/:id/capitulos/:capituloId` | pública | Leitor vertical |
| `/carrinho` | pública (finalizar exige login) | Quantidades, total estimado, checkout com `Idempotency-Key` |
| `/entrar` | pública | Login e cadastro (CPF e senha forte validados no cliente) |
| `/pedidos`, `/perfil` | autenticado | Histórico de pedidos; dados e troca de senha |
| `/admin/acervo`, `/admin/obras/nova`, `/admin/obras/:id/editar`, `/admin/obras/:id/capitulos` | admin | Gestão de obras, capas, capítulos e páginas |

## Decisões principais

- **Autenticação**: o token fica apenas no cookie httpOnly `kumoko_token`. O front nunca guarda token;
  ao carregar chama `GET /api/users/me` e, no logout, `POST /api/auth/logout`. Qualquer 401 fora do
  login derruba a sessão local e as rotas protegidas redirecionam para `/entrar?redirect=...`.
- **Carrinho**: guarda somente `obraId`, `quantidade` e um snapshot para exibição. O preço final é
  sempre calculado pelo order-service. A mesma `Idempotency-Key` é reutilizada em novas tentativas
  enquanto o carrinho não muda, evitando pedidos duplicados.
- **Erros**: `http.js` converte qualquer falha em `ApiError { message, status, requestId }` usando a
  `message` do backend; telas mostram estados de carregamento, vazio e erro, e ações mostram toasts.

## Scripts

```bash
npm install        # dependências
npm run dev        # servidor de desenvolvimento em http://localhost:5173
npm run lint       # ESLint (flat config, react-hooks + react-refresh)
npm run build      # build de produção em dist/
npm run preview    # serve o build localmente
```

## Desenvolvimento apontando para o gateway

Suba a stack (`docker compose up -d` na raiz). Em seguida:

```bash
cp .env.example .env    # VITE_API_URL=/api
npm run dev
```

O Vite encaminha `/api` e `/files` para `VITE_DEV_PROXY_TARGET` (padrão `https://localhost:8443`,
certificado autoassinado aceito em dev). Para outro destino:

```bash
VITE_DEV_PROXY_TARGET=https://localhost:9443 npm run dev
```

Observação: o cookie de sessão é `Secure` + `SameSite=Strict`. Em `http://localhost:5173` os
navegadores tratam `localhost` como contexto seguro, então o login funciona pelo proxy. Se o
auth-service rodar com `COOKIE_SECURE=true` e você acessar o Vite por IP da rede, use o gateway
(`https://localhost:8443`) diretamente.

## Docker

`Dockerfile` multi-stage: `node:22-alpine` (npm ci + build) e `nginx:1.27-alpine` servindo `dist/`
com fallback de SPA, cache imutável em `/assets/`, gzip e `GET /healthz` para o healthcheck.
O container escuta na porta 80 e fica atrás do gateway (não publica portas no host).
