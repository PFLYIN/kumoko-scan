#!/bin/bash
# Cria um banco e um usuario por microsservico (database-per-service).
# Cada usuario recebe privilegios SOMENTE no proprio banco (menor privilegio).
#
# Executado pelo entrypoint oficial do MariaDB apenas na primeira inicializacao
# (volume mariadb_data vazio). O entrypoint pode fazer "source" deste arquivo,
# por isso todo o corpo roda em subshell para nao alterar as opcoes do shell pai.
(
    set -euo pipefail

    log() {
        echo "[init-db] $*"
    }

    # Valida identificadores para evitar SQL injection via variaveis de ambiente.
    require_identifier() {
        local name="$1" value="$2"
        if [[ ! "$value" =~ ^[A-Za-z0-9_]{1,64}$ ]]; then
            log "ERRO: $name invalido ('$value'). Use apenas letras, numeros e _."
            exit 1
        fi
    }

    # Escapa aspas simples e barras invertidas para uso em literal SQL.
    sql_escape() {
        local value="$1"
        value="${value//\\/\\\\}"
        value="${value//\'/\'\'}"
        printf '%s' "$value"
    }

    create_service_db() {
        local prefix="$1"
        local db_var="${prefix}_DB_NAME" user_var="${prefix}_DB_USER" pass_var="${prefix}_DB_PASSWORD"
        local db="${!db_var:?${db_var} nao definida}"
        local user="${!user_var:?${user_var} nao definida}"
        local pass="${!pass_var:?${pass_var} nao definida}"

        require_identifier "$db_var" "$db"
        require_identifier "$user_var" "$user"
        local pass_sql
        pass_sql="$(sql_escape "$pass")"

        log "criando banco '$db' e usuario '$user'"
        MYSQL_PWD="${MARIADB_ROOT_PASSWORD:?MARIADB_ROOT_PASSWORD nao definida}" \
            mariadb --protocol=socket -uroot <<SQL
CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${user}'@'%' IDENTIFIED BY '${pass_sql}';
ALTER USER '${user}'@'%' IDENTIFIED BY '${pass_sql}';
GRANT ALL PRIVILEGES ON \`${db}\`.* TO '${user}'@'%';
SQL
    }

    create_service_db AUTH
    create_service_db CATALOG
    create_service_db ORDER

    MYSQL_PWD="${MARIADB_ROOT_PASSWORD}" mariadb --protocol=socket -uroot -e "FLUSH PRIVILEGES;"
    log "bancos e usuarios criados com sucesso"
)
