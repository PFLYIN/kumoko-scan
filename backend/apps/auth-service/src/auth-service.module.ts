import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@kumoko/cache';
import { createTypeOrmOptions, HealthModule, validateEnv } from '@kumoko/common';
import { MessagingModule } from '@kumoko/messaging';
import { ObservabilityModule } from '@kumoko/observability';
import { SecurityModule } from '@kumoko/security';
import { AUTH_SERVICE_NAME, authEnvSchema } from './config/env.validation';
import { AUTH_MIGRATIONS } from './database/migrations';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Em dev local: apps/auth-service/.env (especifico) e depois .env (compartilhado).
      envFilePath: [`apps/${AUTH_SERVICE_NAME}/.env`, '.env'],
      validate: validateEnv(authEnvSchema),
    }),
    ObservabilityModule.forRoot({ serviceName: AUTH_SERVICE_NAME }),
    SecurityModule.forRoot(),
    RedisModule.forRoot(),
    MessagingModule.forRoot({ serviceName: AUTH_SERVICE_NAME }),
    // Entities registradas via TypeOrmModule.forFeature (autoLoadEntities).
    TypeOrmModule.forRootAsync(createTypeOrmOptions(AUTH_MIGRATIONS, [])),
    HealthModule.register({ checkDatabase: true, checkRedis: true }),
    UsersModule,
    AuthModule,
    SeedModule,
  ],
})
export class AuthServiceModule {}
