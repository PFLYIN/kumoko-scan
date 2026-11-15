import { baseEnvSchema } from '@kumoko/common';
import Joi from 'joi';

export const CATALOG_SERVICE_NAME = 'catalog-service';

/** Variaveis do catalog-service: base + cache, uploads e seed. */
export const catalogEnvSchema = baseEnvSchema.keys({
  PORT: Joi.number().port().default(3002),
  SERVICE_NAME: Joi.string().default(CATALOG_SERVICE_NAME),
  CACHE_TTL_SECONDS: Joi.number().integer().min(1).default(60),
  UPLOADS_DIR: Joi.string().default('/app/uploads'),
  SEED_CATALOG: Joi.boolean().default(true),
  SEED_COVERS_DIR: Joi.string().default('/app/seed/covers'),
});
