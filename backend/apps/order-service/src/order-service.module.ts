import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@kumoko/cache';
import { createTypeOrmOptions, HealthModule, validateEnv } from '@kumoko/common';
import { MessagingModule } from '@kumoko/messaging';
import { ObservabilityModule } from '@kumoko/observability';
import { SecurityModule } from '@kumoko/security';
import { ORDER_SERVICE_NAME, orderEnvSchema } from './config/env.validation';
import { ORDER_ENTITIES } from './database/entities';
import { ORDER_MIGRATIONS } from './database/migrations';
import { CatalogoModule } from './modules/catalogo/catalogo.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Em dev local: apps/order-service/.env (especifico) e depois .env (compartilhado).
      envFilePath: [`apps/${ORDER_SERVICE_NAME}/.env`, '.env'],
      validate: validateEnv(orderEnvSchema),
    }),
    ObservabilityModule.forRoot({ serviceName: ORDER_SERVICE_NAME }),
    SecurityModule.forRoot(),
    RedisModule.forRoot(),
    MessagingModule.forRoot({ serviceName: ORDER_SERVICE_NAME }),
    TypeOrmModule.forRootAsync(createTypeOrmOptions(ORDER_MIGRATIONS, ORDER_ENTITIES)),
    HealthModule.register({ checkDatabase: true, checkRedis: true }),
    PedidosModule,
    CatalogoModule,
  ],
})
export class OrderServiceModule {}
