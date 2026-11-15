import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';

/** Converte a lista CSV de CORS_ORIGINS em array (ignora vazios e espacos). */
export function parseCorsOrigins(value: string | undefined | null): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter((origin) => origin.length > 0);
}

/**
 * CORS com lista explicita de origens e credentials (cookie httpOnly).
 * Requisicoes sem Origin (curl, chamadas servico-a-servico) sao aceitas.
 */
export function buildCorsOptions(corsOrigins: string | undefined | null): CorsOptions {
  const allowed = new Set(parseCorsOrigins(corsOrigins));
  return {
    origin: (origin, callback) => {
      if (!origin || allowed.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'X-Cache'],
    maxAge: 600,
  };
}
