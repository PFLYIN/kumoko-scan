import { type DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { REDIS_CLIENT, REDIS_SUBSCRIBER } from './redis.constants';
import { createRedisConnection } from './redis.factory';
import { RedisShutdownService } from './redis-shutdown.service';

/** Provedores globais REDIS_CLIENT, REDIS_SUBSCRIBER e CacheService. */
@Module({})
export class RedisModule {
  static forRoot(): DynamicModule {
    return {
      module: RedisModule,
      global: true,
      providers: [
        {
          provide: REDIS_CLIENT,
          inject: [ConfigService],
          useFactory: (config: ConfigService) => createRedisConnection(config, 'client'),
        },
        {
          provide: REDIS_SUBSCRIBER,
          inject: [ConfigService],
          useFactory: (config: ConfigService) => createRedisConnection(config, 'subscriber'),
        },
        CacheService,
        RedisShutdownService,
      ],
      exports: [REDIS_CLIENT, REDIS_SUBSCRIBER, CacheService],
    };
  }
}
