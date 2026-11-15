#!/usr/bin/env bash
# Demonstracao da mensageria assincrona (Redis Pub/Sub entre os microsservicos):
#   - cadastro de cliente  -> auth-service publica user.registered (order-service registra)
#   - pedido concluido     -> order-service publica order.completed
#                             auth-service soma o total em totalGasto do usuario
#                             catalog-service soma totalVendido e invalida o cache
# Ao final mostra os logs dos 3 servicos filtrados pelos eventos.
#
# Uso: scripts/demo-events.sh
# Variaveis: BASE_URL, OBRA_ID (padrao: primeira obra do catalogo), LOG_SINCE (padrao 2m).
set -euo pipefail

# shellcheck source-path=SCRIPTDIR source=lib/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

require_cmd curl
require_cmd docker
LOG_SINCE="${LOG_SINCE:-2m}"

printf '%sDemo eventos (Redis Pub/Sub)%s  BASE_URL=%s\n' "$C_BOLD" "$C_RESET" "$BASE_URL"

step "1. Escolhe uma obra do catalogo"
if [[ -n "${OBRA_ID:-}" ]]; then
    http_request GET "$BASE_URL/api/obras/$OBRA_ID"
    expect_status 200 "GET /api/obras/$OBRA_ID"
    VENDIDO_ANTES="$(json_get totalVendido || echo '?')"
else
    http_request GET "$BASE_URL/api/obras?limit=1"
    expect_status 200 "GET /api/obras"
    OBRA_ID="$(json_get data.0.id)" || fail "catalogo vazio."
    VENDIDO_ANTES="$(json_get data.0.totalVendido || echo '?')"
fi
ok "obraId=$OBRA_ID totalVendido=$VENDIDO_ANTES"

step "2. Cadastra um cliente novo (evento user.registered)"
SUFFIX="$(random_suffix)"
EMAIL="eventos.${SUFFIX}@kumoko.local"
SENHA="Evento${SUFFIX: -6}a1"
http_request POST "$BASE_URL/api/auth/register" -H 'Content-Type: application/json' \
    --data-raw "{\"nome\":\"Demo Eventos\",\"email\":\"$EMAIL\",\"cpf\":\"$(gerar_cpf)\",\"senha\":\"$SENHA\"}"
expect_status 201 "POST /api/auth/register"
ok "usuario id=$(json_get id || echo '?') email=$EMAIL"
login "$EMAIL" "$SENHA"

step "3. Finaliza um pedido (evento order.completed)"
http_request POST "$BASE_URL/api/pedidos" -b "$COOKIE_JAR" \
    -H 'Content-Type: application/json' -H "Idempotency-Key: demo-events-$SUFFIX" \
    --data-raw "{\"itens\":[{\"obraId\":$OBRA_ID,\"quantidade\":2}]}"
expect_status 201 "POST /api/pedidos"
PEDIDO_ID="$(json_get id)" || fail "pedido sem id."
TOTAL="$(json_get total || echo '?')"
REQUEST_ID="$(header X-Request-Id)"
ok "pedido id=$PEDIDO_ID total=$TOTAL (X-Request-Id=$REQUEST_ID = correlationId do evento)"

step "4. Aguarda o processamento assincrono pelos consumidores"
sleep 3

http_request GET "$BASE_URL/api/users/me" -b "$COOKIE_JAR"
expect_status 200 "GET /api/users/me"
TOTAL_GASTO="$(json_get totalGasto || echo '?')"
info "auth-service: totalGasto do usuario = $TOTAL_GASTO (esperado $TOTAL)"

http_request GET "$BASE_URL/api/obras/$OBRA_ID"
expect_status 200 "GET /api/obras/$OBRA_ID"
info "catalog-service: totalVendido da obra $OBRA_ID = $(json_get totalVendido || echo '?') (antes: $VENDIDO_ANTES, +2)"

step "5. Logs dos servicos (ultimos $LOG_SINCE) filtrados pelos eventos"
(cd "$REPO_ROOT" && docker compose logs --no-color --since "$LOG_SINCE" \
    auth-service catalog-service order-service 2>/dev/null) |
    grep -E 'Evento publicado|Evento recebido|Evento processado|Falha ao processar evento' |
    sed 's/^/    /' || warn "nenhum log de evento encontrado (servicos no ar? LOG_SINCE=$LOG_SINCE)."

if [[ -n "$REQUEST_ID" ]]; then
    info "Para seguir so este fluxo: docker compose logs | grep $REQUEST_ID"
fi

printf '\n%sDemo concluida.%s\n' "$C_GREEN" "$C_RESET"
