# Gateway HTTPS do Kumoko Scan (reverse proxy + arquivos estaticos de upload).
FROM nginx:1.27-alpine

# openssl: geracao do certificado autoassinado na subida.
RUN apk add --no-cache openssl

# Somente variaveis NGINX_* sao substituidas nos templates; $host, $uri etc. ficam intactas.
ENV NGINX_ENVSUBST_FILTER=^NGINX_ \
    NGINX_HTTPS_PORT=8443 \
    NGINX_HSTS_MAX_AGE=31536000 \
    PUBLIC_HOST=localhost

COPY nginx.conf /etc/nginx/nginx.conf
COPY snippets/ /etc/nginx/snippets/
COPY templates/ /etc/nginx/templates/
COPY docker-entrypoint.d/10-generate-certs.sh /docker-entrypoint.d/10-generate-certs.sh

# Remove o site padrao da imagem, normaliza fim de linha (checkout no Windows)
# e garante que o script de certificado seja executavel.
# /var/www/uploads pertence ao uid 1000 (usuario node do catalog-service): o volume
# uploads_data e compartilhado e herda a posse do primeiro container que o monta.
RUN rm -f /etc/nginx/conf.d/default.conf \
    && find /etc/nginx/nginx.conf /etc/nginx/snippets /etc/nginx/templates \
        /docker-entrypoint.d/10-generate-certs.sh -type f -exec sed -i 's/\r$//' {} + \
    && chmod 0755 /docker-entrypoint.d/10-generate-certs.sh \
    && mkdir -p /etc/nginx/certs /var/www/uploads \
    && chown 1000:1000 /var/www/uploads

EXPOSE 80 443

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1/nginx-health >/dev/null || exit 1
