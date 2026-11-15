import { type DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { parseDurationToSeconds } from './jwt/duration';
import { PasswordHasher } from './passwords/password-hasher';
import {
  DEFAULT_THROTTLE_LIMIT,
  DEFAULT_THROTTLE_TTL_MS,
  THROTTLE_MESSAGE,
} from './throttling/throttling.constants';

export interface SecurityModuleOptions {
  /** Limite global por IP (padrao 100 req / 60s). */
  throttle?: { limit: number; ttlMs: number };
}

/**
 * Registra globalmente, nesta ordem: ThrottlerGuard -> JwtAuthGuard (deny-by-default) -> RolesGuard.
 * Exporta JwtModule (JwtService com JWT_SECRET) e PasswordHasher.
 */
@Module({})
export class SecurityModule {
  static forRoot(options: SecurityModuleOptions = {}): DynamicModule {
    const limit = options.throttle?.limit ?? DEFAULT_THROTTLE_LIMIT;
    const ttl = options.throttle?.ttlMs ?? DEFAULT_THROTTLE_TTL_MS;

    return {
      module: SecurityModule,
      global: true,
      imports: [
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.getOrThrow<string>('JWT_SECRET'),
            signOptions: {
              algorithm: 'HS256',
              expiresIn: parseDurationToSeconds(config.get<string>('JWT_EXPIRES_IN') ?? '1h'),
            },
            verifyOptions: { algorithms: ['HS256'] },
          }),
        }),
        ThrottlerModule.forRoot({
          throttlers: [{ name: 'default', ttl, limit }],
          errorMessage: THROTTLE_MESSAGE,
        }),
      ],
      providers: [
        PasswordHasher,
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
      exports: [JwtModule, PasswordHasher],
    };
  }
}
