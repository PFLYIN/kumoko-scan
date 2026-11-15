/** Conexao principal (comandos de cache e PUBLISH). */
export const REDIS_CLIENT = 'REDIS_CLIENT';

/** Conexao dedicada ao SUBSCRIBE (uma conexao em modo subscriber nao aceita outros comandos). */
export const REDIS_SUBSCRIBER = 'REDIS_SUBSCRIBER';

/** Teto do backoff exponencial de reconexao. */
export const REDIS_MAX_RETRY_DELAY_MS = 5000;
