#!/usr/bin/env bash
# Smoke test ponta a ponta pela borda (gateway Nginx), como um cliente real faria.
# Fluxo: health do gateway -> SPA -> catalogo -> cadastro -> login (cookie) ->
#        /users/me -> pedido -> historico. Sai com codigo != 0 na primeira falha.
#
# Uso: scripts/smoke-test.sh
# Variaveis: BASE_URL (padrao https://localhost:8443), HTTP_URL (padrao http://localhost:${NGINX_HTTP_PORT:-8080})
set -euo pipefail

# shellcheck source-path=SCRIPTDIR source=lib/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

require_cmd curl
HTTP_URL="${HTTP_URL:-http://localhost:$(read_env NGINX_HTTP_PORT | grep . || echo 8080)}"
HTTP_URL="${HTTP_URL%/}"

printf '%sSmoke test Kumoko Scan%s  BASE_URL=%s  HTTP_URL=%s\n' "$C_BOLD" "$C_RESET" "$BASE_URL" "$HTTP_URL"

step "1. Healthcheck do gateway (HTTP)"
http_request GET "$HTTP_URL/nginx-health"
expect_status 200 "GET /nginx-health"
ok "gateway respondeu $(body | tr -d '\n')"

http_request GET "$HTTP_URL/"
expect_status 301 "GET / em HTTP (redirect para HTTPS)"
ok "HTTP redireciona para $(header Location)"

step "2. Frontend (SPA) via HTTPS"
http_request GET "$BASE_URL/"
expect_status 200 "GET /"
body | grep -qi '<div id="root"' || fail "GET / nao parece ser o index.html do SPA."
[[ -n "$(header Strict-Transport-Security)" ]] || fail "cabecalho HSTS ausente na resposta HTTPS."
ok "SPA servido com cabecalhos de seguranca (HSTS, CSP: $(header Content-Security-Policy | cut -c1-40)...)"

step "3. Catalogo publico"
http_request GET "$BASE_URL/api/obras?limit=5"
expect_status 200 "GET /api/obras"
OBRA_ID="$(json_get data.0.id)" || fail "catalogo vazio: nenhuma obra em /api/obras (SEED_CATALOG=true?)."
OBRA_NOME="$(json_get data.0.nome || echo '?')"
TOTAL_OBRAS="$(json_get meta.total || echo '?')"
ok "$TOTAL_OBRAS obra(s) no catalogo; usando obraId=$OBRA_ID ($OBRA_NOME), X-Cache=$(header X-Cache)"

step "4. Cadastro de cliente"
SUFFIX="$(random_suffix)"
EMAIL="smoke.${SUFFIX}@kumoko.local"
SENHA="Smoke${SUFFIX: -6}a1"
CPF="$(gerar_cpf)"
http_request POST "$BASE_URL/api/auth/register" -H 'Content-Type: application/json' \
    --data-raw "{\"nome\":\"Smoke Test\",\"email\":\"$EMAIL\",\"cpf\":\"$CPF\",\"senha\":\"$SENHA\"}"
expect_status 201 "POST /api/auth/register"
USUARIO_ID="$(json_get id)" || fail "cadastro nao retornou id do usuario."
[[ "$(json_get role || true)" == "customer" ]] || fail "cadastro publico deveria criar role=customer."
ok "usuario criado id=$USUARIO_ID email=$EMAIL cpf=$CPF"

step "5. Login (cookie httpOnly)"
login "$EMAIL" "$SENHA"
json_get accessToken >/dev/null || fail "login nao retornou accessToken."
ok "login OK, cookie kumoko_token armazenado"

step "6. Perfil autenticado"
http_request GET "$BASE_URL/api/users/me" -b "$COOKIE_JAR"
expect_status 200 "GET /api/users/me"
[[ "$(json_get email || true)" == "$EMAIL" ]] || fail "GET /api/users/me retornou outro usuario: $(body)"
ok "usuario autenticado: $(json_get nome || true) <$EMAIL>"

http_request GET "$BASE_URL/api/users/me"
expect_status 401 "GET /api/users/me sem cookie"
ok "sem cookie retorna 401 (deny-by-default)"

step "7. Criacao de pedido"
http_request POST "$BASE_URL/api/pedidos" -b "$COOKIE_JAR" \
    -H 'Content-Type: application/json' -H "Idempotency-Key: smoke-$SUFFIX" \
    --data-raw "{\"itens\":[{\"obraId\":$OBRA_ID,\"quantidade\":1}]}"
expect_status 201 "POST /api/pedidos"
PEDIDO_ID="$(json_get id)" || fail "pedido nao retornou id."
ok "pedido criado id=$PEDIDO_ID total=$(json_get total || echo '?') status=$(json_get status || echo '?')"

http_request POST "$BASE_URL/api/pedidos" -b "$COOKIE_JAR" \
    -H 'Content-Type: application/json' -H "Idempotency-Key: smoke-$SUFFIX" \
    --data-raw "{\"itens\":[{\"obraId\":$OBRA_ID,\"quantidade\":1}]}"
expect_status 200 "POST /api/pedidos repetido com a mesma Idempotency-Key"
[[ "$(json_get id || true)" == "$PEDIDO_ID" ]] || fail "idempotencia falhou: novo pedido criado com a mesma chave."
ok "mesma Idempotency-Key devolve o pedido existente (200)"

step "8. Historico de pedidos"
http_request GET "$BASE_URL/api/pedidos" -b "$COOKIE_JAR"
expect_status 200 "GET /api/pedidos"
[[ "$(json_get data.0.id || true)" == "$PEDIDO_ID" ]] || fail "pedido $PEDIDO_ID nao aparece no historico: $(body | head -c 300)"
ok "historico contem o pedido $PEDIDO_ID"

step "9. Endpoints internos nao expostos"
http_request GET "$BASE_URL/metrics"
expect_status 404 "GET /metrics pelo gateway"
ok "/metrics nao e publico"

printf '\n%sSMOKE TEST OK%s\n' "$C_GREEN" "$C_RESET"
