/** Limite padrao aplicado a todas as rotas pelo ThrottlerGuard global (por IP). */
export const DEFAULT_THROTTLE_TTL_MS = 60_000;
export const DEFAULT_THROTTLE_LIMIT = 100;

/** Limite mais restrito para login/cadastro. Uso: `@Throttle(AUTH_THROTTLE)`. */
export const AUTH_THROTTLE = {
  default: { limit: 5, ttl: 60_000 },
};

export const THROTTLE_MESSAGE = 'Muitas requisições. Tente novamente em instantes.';
