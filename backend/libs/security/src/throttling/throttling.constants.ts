/** Limite padrao aplicado a todas as rotas pelo ThrottlerGuard global (por IP). */
export const DEFAULT_THROTTLE_TTL_MS = 60_000;
export const DEFAULT_THROTTLE_LIMIT = 100;

/** Limite mais restrito para login/cadastro. Uso: `@Throttle(AUTH_THROTTLE)`. */
export const AUTH_THROTTLE = {
  default: { limit: 5, ttl: 60_000 },
};

/**
 * Leituras publicas do catalogo (listagem, detalhe, capitulos, paginas, lote): respostas cacheadas no Redis
 * e uma pagina do site dispara varias delas. 100/min por IP esgotava em navegacao normal (vitrines + catalogo
 * + leitor) e no lote consultado pelo order-service. Uso: `@Throttle(PUBLIC_READ_THROTTLE)`.
 */
export const PUBLIC_READ_THROTTLE = {
  default: { limit: 600, ttl: 60_000 },
};

export const THROTTLE_MESSAGE = 'Muitas requisições. Tente novamente em instantes.';
