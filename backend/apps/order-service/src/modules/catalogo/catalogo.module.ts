import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CATALOG_HTTP_CLIENT } from './catalogo.constants';
import { CATALOG_SLEEP, CatalogClient, defaultSleep } from './catalog.client';
import { CatalogoStatusController } from './controllers/catalogo-status.controller';
import { CatalogoEventsListener } from './events/catalogo-events.listener';

/** Integracao com o catalog-service (ACL + circuit breaker) e reacao aos eventos catalog.* / user.*. */
@Module({
  controllers: [CatalogoStatusController],
  providers: [
    {
      provide: CATALOG_HTTP_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        axios.create({
          baseURL: config.getOrThrow<string>('CATALOG_SERVICE_URL'),
          timeout: Number(config.get('CATALOG_TIMEOUT_MS') ?? 2000),
          headers: { Accept: 'application/json' },
        }),
    },
    { provide: CATALOG_SLEEP, useValue: defaultSleep },
    CatalogClient,
    CatalogoEventsListener,
  ],
  exports: [CatalogClient],
})
export class CatalogoModule {}
