#!/usr/bin/env bash
# Funcoes compartilhadas pelos scripts de demonstracao e smoke test.
# Uso: source "$(dirname "$0")/lib/common.sh"
# Compativel com Linux, macOS e Git Bash no Windows. Dependencias: curl e
# (opcional) node ou jq para ler JSON; sem eles cai para grep/sed.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BASE_URL="${BASE_URL:-https://localhost:8443}"
BASE_URL="${BASE_URL%/}"

if [[ -t 1 ]]; then
    C_GREEN=$'\033[32m'; C_RED=$'\033[31m'; C_YELLOW=$'\033[33m'; C_BOLD=$'\033[1m'; C_RESET=$'\033[0m'
else
    C_GREEN=''; C_RED=''; C_YELLOW=''; C_BOLD=''; C_RESET=''
fi

step() { printf '\n%s==> %s%s\n' "$C_BOLD" "$*" "$C_RESET"; }
info() { printf '    %s\n' "$*"; }
ok() { printf '    %s[OK]%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn() { printf '    %s[AVISO]%s %s\n' "$C_YELLOW" "$C_RESET" "$*" >&2; }
fail() {
    printf '    %s[FALHA]%s %s\n' "$C_RED" "$C_RESET" "$*" >&2
    exit 1
}

require_cmd() {
    command -v "$1" >/dev/null 2>&1 || fail "comando '$1' nao encontrado no PATH."
}

# Diretorio temporario removido ao sair.
WORK_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t kumoko)"
COOKIE_JAR="$WORK_DIR/cookies.txt"
trap 'rm -rf "$WORK_DIR"' EXIT

# Executa uma requisicao HTTP.
#   http_request METODO URL [args extras do curl...]
# Corpo em $WORK_DIR/body, cabecalhos em $WORK_DIR/headers; status em HTTP_STATUS.
HTTP_STATUS=000
http_request() {
    local method="$1" url="$2"
    shift 2
    HTTP_STATUS="$(curl -k -sS -X "$method" \
        -o "$WORK_DIR/body" -D "$WORK_DIR/headers" \
        -w '%{http_code}' --max-time 20 \
        "$@" "$url")" || HTTP_STATUS=000
}

body() {
    cat "$WORK_DIR/body" 2>/dev/null || true
}

# Valor de um cabecalho da ultima resposta (case-insensitive, sem \r).
header() {
    local name="$1"
    grep -i "^${name}:" "$WORK_DIR/headers" 2>/dev/null | tail -n 1 | cut -d: -f2- | tr -d '\r' | sed 's/^ *//'
}

# Falha com mensagem clara se o status da ultima resposta nao for o esperado.
expect_status() {
    local expected="$1" context="$2"
    if [[ "$HTTP_STATUS" != "$expected" ]]; then
        if [[ "$HTTP_STATUS" == "000" ]]; then
            fail "$context: sem resposta de $BASE_URL (stack no ar? docker compose ps)."
        fi
        fail "$context: esperado HTTP $expected, recebido $HTTP_STATUS. Corpo: $(body | head -c 500)"
    fi
}

# Le um campo do JSON da ultima resposta. Caminho com pontos: "data.0.id", "usuario.email".
# Retorna vazio (status 1) se o campo nao existir.
json_get() {
    local path="$1" file="$WORK_DIR/body"
    if command -v node >/dev/null 2>&1; then
        node -e '
            const fs = require("fs");
            let v;
            try { v = JSON.parse(fs.readFileSync(0, "utf8")); } catch { process.exit(1); }
            for (const k of process.argv[1].split(".")) {
                if (v === null || v === undefined) process.exit(1);
                v = v[k];
            }
            if (v === null || v === undefined) process.exit(1);
            process.stdout.write(typeof v === "object" ? JSON.stringify(v) : String(v));
        ' "$path" <"$file"
    elif command -v jq >/dev/null 2>&1; then
        local jq_path
        jq_path="$(printf '%s' "$path" | sed -E 's/\.([0-9]+)/[\1]/g; s/^/./')"
        jq -er "$jq_path" <"$file"
    else
        # Fallback simples: primeira ocorrencia da ultima chave do caminho.
        local key="${path##*.}"
        local value
        value="$(tr -d '\n' <"$file" | grep -oE "\"$key\"[[:space:]]*:[[:space:]]*(\"[^\"]*\"|[^,}]+)" | head -n 1 |
            sed -E "s/^\"$key\"[[:space:]]*:[[:space:]]*//; s/^\"//; s/\"$//")"
        [[ -n "$value" ]] || return 1
        printf '%s' "$value"
    fi
}

# Le uma variavel do .env da raiz (sem executar o arquivo). A variavel de ambiente tem prioridade.
read_env() {
    local key="$1" value="${!1:-}"
    if [[ -z "$value" && -f "$REPO_ROOT/.env" ]]; then
        value="$(grep -E "^${key}=" "$REPO_ROOT/.env" | tail -n 1 | cut -d= -f2- | tr -d '\r')"
        value="${value%\"}"; value="${value#\"}"
        value="${value%\'}"; value="${value#\'}"
    fi
    printf '%s' "$value"
}

# Gera um CPF valido aleatorio (11 digitos, com digitos verificadores corretos).
gerar_cpf() {
    local -a d
    local i sum r
    while :; do
        d=()
        for i in 0 1 2 3 4 5 6 7 8; do d+=($((RANDOM % 10))); done
        # Rejeita sequencias repetidas (111.111.111-xx), invalidas pela regra do CPF.
        if [[ "${d[*]}" != "${d[0]} ${d[0]} ${d[0]} ${d[0]} ${d[0]} ${d[0]} ${d[0]} ${d[0]} ${d[0]}" ]]; then
            break
        fi
    done
    sum=0
    for i in 0 1 2 3 4 5 6 7 8; do sum=$((sum + d[i] * (10 - i))); done
    r=$(((sum * 10) % 11))
    if ((r == 10)); then r=0; fi
    d+=("$r")
    sum=0
    for i in 0 1 2 3 4 5 6 7 8 9; do sum=$((sum + d[i] * (11 - i))); done
    r=$(((sum * 10) % 11))
    if ((r == 10)); then r=0; fi
    d+=("$r")
    printf '%s' "${d[@]}"
}

# Sufixo aleatorio para e-mails/chaves de idempotencia.
random_suffix() {
    printf '%s%s%s' "$(date +%s)" "$RANDOM" "$RANDOM"
}

# Escapa barra invertida e aspas para montar JSON com printf.
json_escape() {
    local value="$1"
    value="${value//\\/\\\\}"
    value="${value//\"/\\\"}"
    printf '%s' "$value"
}

# Login guardando o cookie httpOnly kumoko_token em $COOKIE_JAR.
login() {
    local email="$1" senha="$2" payload
    payload="$(printf '{"email":"%s","senha":"%s"}' "$(json_escape "$email")" "$(json_escape "$senha")")"
    http_request POST "$BASE_URL/api/auth/login" \
        -H 'Content-Type: application/json' -c "$COOKIE_JAR" --data-raw "$payload"
    expect_status 200 "POST /api/auth/login ($email)"
    grep -q 'kumoko_token' "$COOKIE_JAR" || fail "login nao devolveu o cookie kumoko_token."
}

# Executa redis-cli dentro do container (senha lida do ambiente do proprio container).
redis_cli() {
    (cd "$REPO_ROOT" && docker compose exec -T redis \
        sh -c 'redis-cli -a "$REDIS_PASSWORD" --no-auth-warning "$@"' redis-cli "$@")
}

has_docker_compose() {
    command -v docker >/dev/null 2>&1 || return 1
    [[ -n "$(cd "$REPO_ROOT" && docker compose ps -q --status running redis 2>/dev/null)" ]]
}
