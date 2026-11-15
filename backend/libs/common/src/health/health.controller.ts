import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheck,
  type HealthCheckResult,
  HealthCheckService,
  type HealthIndicatorFunction,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '@kumoko/security';
import { HEALTH_CHECK_TIMEOUT_MS, HEALTH_OPTIONS, type HealthModuleOptions } from './health.constants';
import { RedisHealthIndicator } from './redis.health';

/** GET /health (fora do prefixo /api; usado pelo healthcheck do Docker Compose). */
@ApiExcludeController()
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    @Inject(HEALTH_OPTIONS) private readonly options: HealthModuleOptions,
    private readonly health: HealthCheckService,
    private readonly typeOrm: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    const checks: HealthIndicatorFunction[] = [];
    if (this.options.checkDatabase) {
      checks.push(() => this.typeOrm.pingCheck('database').withTimeout(HEALTH_CHECK_TIMEOUT_MS));
    }
    if (this.options.checkRedis) {
      checks.push(() => this.redis.pingCheck('redis'));
    }
    return this.health.check(checks);
  }
}
