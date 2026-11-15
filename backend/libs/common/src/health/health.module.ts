import { type DynamicModule, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HEALTH_OPTIONS, type HealthModuleOptions } from './health.constants';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';

/** `HealthModule.register({ checkDatabase, checkRedis })` expoe GET /health via Terminus. */
@Module({})
export class HealthModule {
  static register(options: HealthModuleOptions): DynamicModule {
    return {
      module: HealthModule,
      imports: [TerminusModule.forRoot({ errorLogStyle: 'json' })],
      controllers: [HealthController],
      providers: [{ provide: HEALTH_OPTIONS, useValue: options }, RedisHealthIndicator],
    };
  }
}
