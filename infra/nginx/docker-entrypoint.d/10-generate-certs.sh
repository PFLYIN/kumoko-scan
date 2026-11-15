#!/bin/sh
# Gera um certificado TLS autoassinado na primeira subida do gateway.
# Os arquivos ficam no volume gateway_certs e sao reaproveitados nas proximas subidas.
set -eu

ME=$(basename "$0")
CERT_DIR=/etc/nginx/certs
CRT="$CERT_DIR/server.crt"
KEY="$CERT_DIR/server.key"
HOST="${PUBLIC_HOST:-localhost}"

log() {
    echo "$ME: $*"
}

if [ -s "$CRT" ] && [ -s "$KEY" ]; then
    log "certificado existente mantido ($CRT)"
    exit 0
fi

# PUBLIC_HOST vai para o SAN; aceita apenas hostname ou IPv4.
if ! printf '%s' "$HOST" | grep -Eq '^[A-Za-z0-9.-]+$'; then
    log "PUBLIC_HOST invalido: '$HOST'"
    exit 1
fi

SAN="DNS:localhost,IP:127.0.0.1"
if printf '%s' "$HOST" | grep -Eq '^[0-9]+(\.[0-9]+){3}$'; then
    [ "$HOST" != "127.0.0.1" ] && SAN="$SAN,IP:$HOST"
elif [ "$HOST" != "localhost" ]; then
    SAN="$SAN,DNS:$HOST"
fi

mkdir -p "$CERT_DIR"
log "gerando certificado autoassinado (CN=$HOST, SAN=$SAN)"

openssl req -x509 -nodes -newkey rsa:2048 -sha256 -days 825 \
    -subj "/CN=$HOST/O=Kumoko Scan" \
    -addext "subjectAltName=$SAN" \
    -addext "keyUsage=critical,digitalSignature,keyEncipherment" \
    -addext "extendedKeyUsage=serverAuth" \
    -keyout "$KEY.tmp" -out "$CRT.tmp" 2>/dev/null

mv "$KEY.tmp" "$KEY"
mv "$CRT.tmp" "$CRT"
chmod 600 "$KEY"
chmod 644 "$CRT"

log "certificado gerado em $CRT (valido por 825 dias)"
