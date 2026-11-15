export const HEALTH_OPTIONS = Symbol('HEALTH_OPTIONS');

export interface HealthModuleOptions {
  /** Inclui ping no banco (TypeORM) no GET /health. */
  checkDatabase: boolean;
  /** Inclui PING no Redis (REDIS_CLIENT) no GET /health. */
  checkRedis: boolean;
}

/** Tempo maximo de cada verificacao do healthcheck. */
export const HEALTH_CHECK_TIMEOUT_MS = 1500;
