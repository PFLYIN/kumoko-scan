import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Redis, type RedisOptions } from 'ioredis';
import { REDIS_MAX_RETRY_DELAY_MS } from './redis.constants';

export type RedisConnectionRole = 'client' | 'subscriber';

const ERROR_LOG_INTERVAL_MS = 10_000;

/** Backoff exponencial: 100ms, 200ms, 400ms ... ate 5s. Nunca desiste de reconectar. */
export function redisRetryStrategy(times: number): number {
  return Math.min(100 * 2 ** Math.max(times - 1, 0), REDIS_MAX_RETRY_DELAY_MS);
}

/** Opcoes do ioredis a partir de REDIS_HOST/PORT/PASSWORD. */
export function buildRedisOptions(config: ConfigService, role: RedisConnectionRole): RedisOptions {
  const password = config.get<string>('REDIS_PASSWORD');
  const serviceName = config.get<string>('SERVICE_NAME') ?? 'kumoko';
  const base: RedisOptions = {
    host: config.getOrThrow<string>('REDIS_HOST'),
    port: Number(config.get<number>('REDIS_PORT') ?? 6379),
    password: password ? password : undefined,
    connectionName: `${serviceName}:${role}`,
    retryStrategy: redisRetryStrategy,
  };
  if (role === 'subscriber') {
    // O subscriber precisa enfileirar SUBSCRIBE enquanto conecta e reassinar ao reconectar.
    return { ...base, maxRetriesPerRequest: null, enableOfflineQueue: true, autoResubscribe: true };
  }
  // Cliente de cache falha rapido: se o Redis cair, o CacheService cai para a origem.
  return { ...base, maxRetriesPerRequest: 2, enableOfflineQueue: false };
}

/** Cria a conexao e registra logs de estado (sem inundar o log enquanto o Redis estiver fora). */
export function createRedisConnection(config: ConfigService, role: RedisConnectionRole): Redis {
  const logger = new Logger(`Redis:${role}`);
  const client = new Redis(buildRedisOptions(config, role));
  let lastErrorLog = 0;

  client.on('ready', () => {
    lastErrorLog = 0;
    logger.log(`Redis conectado role=${role}`);
  });
  client.on('error', (error: Error) => {
    const now = Date.now();
    if (now - lastErrorLog >= ERROR_LOG_INTERVAL_MS) {
      lastErrorLog = now;
      logger.warn(`Redis indisponivel role=${role} erro=${error.message}`);
    }
  });
  client.on('end', () => logger.log(`Conexao Redis encerrada role=${role}`));
  return client;
}
