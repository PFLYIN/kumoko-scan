import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { HealthIndicatorService } from '@nestjs/terminus';
import { REDIS_CLIENT } from '@kumoko/cache';
import type { Redis } from 'ioredis';
import { HEALTH_CHECK_TIMEOUT_MS } from './health.constants';

/** Indicador customizado: envia PING ao Redis e espera PONG. */
@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly moduleRef: ModuleRef,
  ) {}

  pingCheck<const Key extends string>(key: Key) {
    return this.healthIndicatorService
      .check(key)
      .attempt(async () => {
        // Resolvido sob demanda: o HealthModule nao exige RedisModule quando checkRedis=false.
        const redis = this.moduleRef.get<Redis>(REDIS_CLIENT, { strict: false });
        const reply: string = await redis.ping();
        if (reply !== 'PONG') {
          throw new Error(`Resposta inesperada do Redis: ${reply}`);
        }
      })
      .withTimeout(HEALTH_CHECK_TIMEOUT_MS);
  }
}
