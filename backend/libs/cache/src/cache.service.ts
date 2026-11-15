import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { MetricsService } from '@kumoko/observability';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

export interface CacheResult<T> {
  value: T;
  hit: boolean;
}

const SCAN_BATCH_SIZE = 200;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Escapa caracteres especiais de glob do Redis para usar o prefixo literal no MATCH. */
function escapeGlob(value: string): string {
  return value.replace(/[*?[\]\\]/g, (char) => `\\${char}`);
}

/**
 * Cache-aside sobre Redis. Qualquer falha do Redis e logada como warn e a request segue
 * pela origem (loader): o cache nunca derruba a request.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    // Opcional: sem ObservabilityModule (ex.: testes) o cache funciona sem metricas.
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  async getOrSet<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<CacheResult<T>> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      this.logger.log(`Cache HIT key=${key}`);
      return { value: cached, hit: true };
    }
    this.logger.log(`Cache MISS key=${key} ttl=${ttlSeconds}`);
    const value = await loader();
    await this.set(key, value, ttlSeconds);
    return { value, hit: false };
  }

  /** Le e desserializa; `undefined` em miss, valor corrompido ou Redis indisponivel. */
  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.read<T>(key);
    this.metrics?.recordCacheOperation(value === undefined ? 'miss' : 'hit');
    return value;
  }

  private async read<T>(key: string): Promise<T | undefined> {
    let raw: string | null;
    try {
      raw = await this.redis.get(key);
    } catch (error) {
      this.logger.warn(
        `Cache indisponivel na leitura key=${key} erro=${errorMessage(error)}; usando a origem`,
      );
      return undefined;
    }
    if (raw === null) {
      return undefined;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      this.logger.warn(`Valor de cache invalido descartado key=${key}`);
      return undefined;
    }
  }

  /** Grava com TTL. Valores `undefined` nao sao cacheados. Retorna false se o Redis falhar. */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
    if (value === undefined) {
      return false;
    }
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', Math.max(1, Math.floor(ttlSeconds)));
      return true;
    } catch (error) {
      this.logger.warn(`Cache indisponivel na escrita key=${key} erro=${errorMessage(error)}`);
      return false;
    }
  }

  async invalidate(key: string): Promise<number> {
    try {
      const removed = await this.redis.del(key);
      this.metrics?.recordCacheOperation('invalidate');
      this.logger.log(`Cache INVALIDATE key=${key} removidas=${removed}`);
      return removed;
    } catch (error) {
      this.logger.warn(`Falha ao invalidar cache key=${key} erro=${errorMessage(error)}`);
      return 0;
    }
  }

  /** Remove todas as chaves com o prefixo usando SCAN + UNLINK (nunca KEYS, que bloqueia o Redis). */
  async invalidatePrefix(prefix: string): Promise<number> {
    const pattern = `${escapeGlob(prefix)}*`;
    let cursor = '0';
    let removed = 0;
    try {
      do {
        const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', SCAN_BATCH_SIZE);
        cursor = nextCursor;
        if (keys.length > 0) {
          removed += await this.redis.unlink(...keys);
        }
      } while (cursor !== '0');
      this.metrics?.recordCacheOperation('invalidate');
      this.logger.log(`Cache INVALIDATE prefix=${prefix} removidas=${removed}`);
      return removed;
    } catch (error) {
      this.logger.warn(`Falha ao invalidar cache prefix=${prefix} erro=${errorMessage(error)}`);
      return removed;
    }
  }
}
