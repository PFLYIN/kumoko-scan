import { baseEnvSchema } from '@kumoko/common';
import Joi from 'joi';

export const ORDER_SERVICE_NAME = 'order-service';

/** Variaveis do order-service: base + integracao com o catalogo e cache. */
export const orderEnvSchema = baseEnvSchema.keys({
  PORT: Joi.number().port().default(3003),
  SERVICE_NAME: Joi.string().default(ORDER_SERVICE_NAME),
  CATALOG_SERVICE_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://catalog-service:3002'),
  CATALOG_TIMEOUT_MS: Joi.number().integer().min(100).default(2000),
  CATALOG_RETRIES: Joi.number().integer().min(0).max(5).default(2),
  CACHE_TTL_SECONDS: Joi.number().integer().min(1).default(60),
});
