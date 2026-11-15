# ADR-006: Autenticação com JWT em cookie httpOnly (e Bearer para ferramentas)

- **Status:** Aceito
- **Data:** 2026-11-14

## Contexto

No legado o token JWT era guardado em `localStorage` (legível por qualquer script na
origem), o segredo tinha valor de fallback no código e o papel de administrador era
concedido no cadastro quando o e-mail coincidia com um endereço fixo. Agora três
serviços precisam autenticar e autorizar requisições sem que cada chamada consulte o
`auth-service`.

## Decisão

- O `auth-service` emite um **JWT HS256** com payload `{ sub, email, nome, role }` e
  validade `JWT_EXPIRES_IN` (padrão 1h) no `POST /api/auth/login`.
- O token é entregue de duas formas:
  - **cookie `kumoko_token`** `httpOnly`, `Secure` (`COOKIE_SECURE`), `SameSite=Strict`,
    `Path=/`, usado pelo SPA, que nunca lê nem guarda o token;
  - no corpo da resposta (`accessToken`), para Swagger, scripts e testes via
    `Authorization: Bearer`.
- Cada serviço valida o token **localmente** com o mesmo `JWT_SECRET` (mínimo 32
  caracteres, validado com Joi no boot e **sem fallback**: o serviço não sobe sem ele).
- `JwtAuthGuard` global com **negação por padrão**; rotas abertas usam `@Public()`;
  rotas administrativas usam `@Roles('admin')`.
- O cadastro público cria sempre `customer`. O administrador é criado/atualizado no
  boot a partir de `ADMIN_*` (seeder idempotente).
- Senhas com `bcryptjs` custo 12; política mínima de 8 caracteres com letra e número.
- Login e cadastro limitados (5/min no serviço, 10/min por IP no gateway); a mensagem de
  falha de login é sempre "Credenciais inválidas.".

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|---|---|---|---|
| Token em `localStorage` + Bearer (legado) | Simples, sem CSRF | Exposto a XSS | Risco desnecessário |
| Sessão no servidor (Redis) | Revogação imediata | Estado compartilhado; cada serviço consulta o Redis | Contraria a validação local e acopla serviços |
| OAuth2/OIDC com Keycloak | Padrão de mercado, SSO | Mais um container pesado e fluxo complexo | Desproporcional ao escopo |
| JWT RS256 com JWKS | Serviços só têm a chave pública | Gestão de par de chaves e rotação | Evolução possível; HS256 basta com segredo forte e rede interna |

## Consequências

**Positivas**

- XSS não consegue ler o token; o SPA não lida com segredos.
- CSRF mitigado por `SameSite=Strict`, mesma origem via gateway e API JSON
  (multipart só em rotas administrativas autenticadas).
- Serviços autorizam sem chamada de rede extra.

**Negativas / trade-offs**

- **Sem revogação antes da expiração:** o logout apaga o cookie, mas um token copiado
  continua válido até expirar (por isso a validade curta de 1h). Mudança de papel só
  vale no próximo login.
- Segredo simétrico compartilhado entre os três serviços: o vazamento de um afeta todos.
- Não há refresh token; o usuário refaz login ao expirar.

## Revisitar quando

- Houver requisito de revogação imediata: lista de bloqueio por `jti` no Redis ou
  tokens de acesso curtos + refresh token.
- Houver serviços de terceiros validando tokens: migrar para RS256 + JWKS.
