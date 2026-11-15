/** Token do cliente HTTP (instancia axios) usado pelo CatalogClient. */
export const CATALOG_HTTP_CLIENT = Symbol('CATALOG_HTTP_CLIENT');

export const CATALOG_SERVICE_NAME = 'catalog-service';

/** Rota do catalogo que devolve varias obras de uma vez (`?ids=1,2,3`). */
export const CATALOG_LOTE_PATH = '/api/obras/lote';

/** Prefixo do cache-aside de precos; invalidado pelos eventos catalog.obra.*. */
export const CATALOG_PRECOS_CACHE_PREFIX = 'orders:catalog-precos:';
export const CATALOG_PRECOS_CACHE_TTL_SECONDS = 30;

export const CATALOGO_INDISPONIVEL_MESSAGE =
  'Catálogo indisponível no momento. Tente novamente em instantes.';
export const CATALOGO_RESPOSTA_INVALIDA_MESSAGE = 'O catálogo respondeu de forma inesperada.';

/** Parametros do circuit breaker (opossum). */
export const CIRCUIT_ERROR_THRESHOLD_PERCENTAGE = 50;
export const CIRCUIT_RESET_TIMEOUT_MS = 10_000;
export const CIRCUIT_VOLUME_THRESHOLD = 3;
/** O timeout do breaker e um pouco maior que o do axios: o axios aborta primeiro. */
export const CIRCUIT_TIMEOUT_MARGIN_MS = 500;

/** Backoff exponencial com jitter entre as tentativas. */
export const RETRY_BASE_DELAY_MS = 200;
export const RETRY_MAX_DELAY_MS = 2_000;

/** Monta a chave de cache com os ids ordenados e sem repeticao. */
export function catalogPrecosCacheKey(ids: readonly number[]): string {
  return `${CATALOG_PRECOS_CACHE_PREFIX}${normalizeIds(ids).join(',')}`;
}

export function normalizeIds(ids: readonly number[]): number[] {
  return [...new Set(ids)].sort((a, b) => a - b);
}
