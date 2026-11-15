#!/usr/bin/env bash
# Demonstracao do cache-aside no catalog-service (Redis):
#   1) GET /api/obras/:id duas vezes -> X-Cache MISS e depois HIT (+ TTL da chave)
#   2) admin altera o preco (PATCH)  -> o servico invalida as chaves catalog:obras:*
#   3) GET de novo                   -> MISS (dado novo) e depois HIT
#
# Uso: scripts/demo-cache.sh [obraId]
# Variaveis: BASE_URL, OBRA_ID, ADMIN_EMAIL/ADMIN_PASSWORD (padrao: lidos do .env).
set -euo pipefail

# shellcheck source-path=SCRIPTDIR source=lib/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

require_cmd curl
OBRA_ID="${1:-${OBRA_ID:-1}}"
CACHE_KEY="catalog:obras:id:${OBRA_ID}"
ADMIN_EMAIL="$(read_env ADMIN_EMAIL)"
ADMIN_PASSWORD="$(read_env ADMIN_PASSWORD)"
[[ -n "$ADMIN_EMAIL" && -n "$ADMIN_PASSWORD" ]] || fail "defina ADMIN_EMAIL e ADMIN_PASSWORD (no .env ou no ambiente)."

USE_REDIS=false
if has_docker_compose; then
    USE_REDIS=true
else
    warn "container redis nao encontrado via docker compose; TTL e chaves nao serao exibidos."
fi

show_ttl() {
    if [[ "$USE_REDIS" == true ]]; then
        info "TTL de $CACHE_KEY no Redis: $(redis_cli TTL "$CACHE_KEY" | tr -d '\r') s (-2 = chave inexistente)"
    fi
}

get_obra() {
    local label="$1"
    http_request GET "$BASE_URL/api/obras/$OBRA_ID"
    expect_status 200 "GET /api/obras/$OBRA_ID"
    info "$label -> X-Cache: ${C_BOLD}$(header X-Cache)${C_RESET}  preco=$(json_get preco || echo '?')  X-Request-Id=$(header X-Request-Id)"
}

printf '%sDemo cache-aside%s  BASE_URL=%s  obraId=%s  chave=%s\n' "$C_BOLD" "$C_RESET" "$BASE_URL" "$OBRA_ID" "$CACHE_KEY"

step "0. Estado inicial: remove a chave para comecar do zero"
if [[ "$USE_REDIS" == true ]]; then
    info "DEL $CACHE_KEY -> $(redis_cli DEL "$CACHE_KEY" | tr -d '\r')"
else
    info "(pulado: sem acesso ao Redis)"
fi

step "1. Primeira leitura: vai ao banco e grava no Redis"
get_obra "GET #1"
PRECO_ATUAL="$(json_get preco)" || fail "resposta sem campo preco."
show_ttl

step "2. Segunda leitura: servida pelo Redis"
get_obra "GET #2"
[[ "$(header X-Cache)" == "HIT" ]] || warn "esperado X-Cache: HIT na segunda leitura."
show_ttl

step "3. Admin altera o preco (escrita invalida o cache e publica catalog.obra.updated)"
login "$ADMIN_EMAIL" "$ADMIN_PASSWORD"
if [[ "$PRECO_ATUAL" == "42.9" || "$PRECO_ATUAL" == "42.90" ]]; then NOVO_PRECO="44.90"; else NOVO_PRECO="42.90"; fi
http_request PATCH "$BASE_URL/api/obras/$OBRA_ID" -b "$COOKIE_JAR" --form-string "preco=$NOVO_PRECO"
expect_status 200 "PATCH /api/obras/$OBRA_ID"
ok "preco alterado: $PRECO_ATUAL -> $(json_get preco || echo "$NOVO_PRECO")"
show_ttl

step "4. Leitura apos a escrita: cache invalidado, dado novo vem do banco"
get_obra "GET #3"
[[ "$(header X-Cache)" == "MISS" ]] || warn "esperado X-Cache: MISS apos a invalidacao."
get_obra "GET #4"
show_ttl

if [[ "$USE_REDIS" == true ]]; then
    step "5. Chaves do catalogo no Redis (SCAN catalog:*)"
    redis_cli --scan --pattern 'catalog:*' | tr -d '\r' | sed 's/^/    /'
    info "Logs relacionados: docker compose logs catalog-service | grep -E 'Cache (HIT|MISS|INVALIDATE)'"
fi

printf '\n%sDemo concluida.%s\n' "$C_GREEN" "$C_RESET"
