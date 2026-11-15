import Joi from 'joi';
import { baseEnvSchema, validateEnv } from './env.validation';

const validEnv = {
  PORT: '3001',
  SERVICE_NAME: 'auth-service',
  DB_HOST: 'mariadb',
  DB_NAME: 'kumoko_auth',
  DB_USER: 'kumoko_auth',
  DB_PASSWORD: 'segredo',
  REDIS_HOST: 'redis',
  JWT_SECRET: 'x'.repeat(32),
};

describe('validateEnv', () => {
  it('converte tipos e aplica defaults', () => {
    const config = validateEnv(baseEnvSchema)(validEnv);
    expect(config).toMatchObject({
      PORT: 3001,
      DB_PORT: 3306,
      REDIS_PORT: 6379,
      NODE_ENV: 'development',
      LOG_LEVEL: 'info',
    });
  });

  it('falha rapido listando todas as variaveis invalidas sem expor valores', () => {
    const validate = validateEnv(baseEnvSchema);
    const run = () => validate({ ...validEnv, JWT_SECRET: 'curto-demais', DB_HOST: undefined });
    expect(run).toThrow(/JWT_SECRET/);
    expect(run).toThrow(/DB_HOST/);
    expect(run).not.toThrow(/curto-demais/);
  });

  it('permite que cada app estenda o schema base', () => {
    const schema = baseEnvSchema.keys({
      PORT: Joi.number().port().default(3002),
      SERVICE_NAME: Joi.string().default('catalog-service'),
      SEED_CATALOG: Joi.boolean().default(true),
    });
    const { PORT: _port, SERVICE_NAME: _name, ...rest } = validEnv;
    const config = validateEnv(schema)({ ...rest, SEED_CATALOG: 'false' });
    expect(config).toMatchObject({ PORT: 3002, SERVICE_NAME: 'catalog-service', SEED_CATALOG: false });
  });
});
