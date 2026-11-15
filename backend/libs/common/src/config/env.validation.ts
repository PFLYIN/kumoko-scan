import Joi from 'joi';

/**
 * Variaveis lidas por TODOS os servicos. Cada app estende com `baseEnvSchema.keys({...})`,
 * definindo PORT/SERVICE_NAME padrao e as variaveis especificas. Segredos nunca tem default.
 */
export const baseEnvSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().required(),
  SERVICE_NAME: Joi.string().required(),
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent').default('info'),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(3306),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  JWT_SECRET: Joi.string().min(32).required(),
  CORS_ORIGINS: Joi.string().allow('').default(''),
});

/**
 * Cria a funcao `validate` do ConfigModule. Falha rapido no boot listando todos os erros
 * (as mensagens do Joi citam o nome da variavel, nunca o valor).
 */
export function validateEnv(schema: Joi.ObjectSchema) {
  return (config: Record<string, unknown>): Record<string, unknown> => {
    const result = schema.validate(config, {
      allowUnknown: true,
      abortEarly: false,
      convert: true,
    });
    if (result.error) {
      const details = result.error.details.map((detail) => detail.message).join('; ');
      throw new Error(`Configuracao de ambiente invalida: ${details}`);
    }
    return result.value as Record<string, unknown>;
  };
}
