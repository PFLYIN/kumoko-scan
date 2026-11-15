import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@kumoko/cache';
import { createTypeOrmOptions, HealthModule, validateEnv } from '@kumoko/common';
import { MessagingModule } from '@kumoko/messaging';
import { ObservabilityModule } from '@kumoko/observability';
import { SecurityModule } from '@kumoko/security';
import { CATALOG_SERVICE_NAME, catalogEnvSchema } from './config/env.validation';
import { CATALOG_ENTITIES, CATALOG_MIGRATIONS } from './database/catalog-schema';
import { CapitulosModule } from './modules/capitulos/capitulos.module';
import { ObrasModule } from './modules/obras/obras.module';
import { PaginasModule } from './modules/paginas/paginas.module';
import { CatalogCoreModule } from './shared/catalog-core.module';
import { ImageBackfillModule } from './shared/images/image-backfill.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Em dev local: apps/catalog-service/.env (especifico) e depois .env (compartilhado).
      envFilePath: [`apps/${CATALOG_SERVICE_NAME}/.env`, '.env'],
      validate: validateEnv(catalogEnvSchema),
    }),
    ObservabilityModule.forRoot({ serviceName: CATALOG_SERVICE_NAME }),
    SecurityModule.forRoot(),
    RedisModule.forRoot(),
    MessagingModule.forRoot({ serviceName: CATALOG_SERVICE_NAME }),
    // Migrations importadas explicitamente (o build webpack nao suporta glob).
    TypeOrmModule.forRootAsync(createTypeOrmOptions(CATALOG_MIGRATIONS, CATALOG_ENTITIES)),
    HealthModule.register({ checkDatabase: true, checkRedis: true }),
    CatalogCoreModule,
    ObrasModule,
    CapitulosModule,
    PaginasModule,
    ImageBackfillModule,
  ],
})
export class CatalogServiceModule {}
