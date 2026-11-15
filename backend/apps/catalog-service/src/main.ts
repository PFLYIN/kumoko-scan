import { runService } from '@kumoko/common';
import { CatalogServiceModule } from './catalog-service.module';
import { CATALOG_SERVICE_NAME } from './config/env.validation';

runService(CatalogServiceModule, {
  serviceName: CATALOG_SERVICE_NAME,
  docsPath: 'catalog',
  docsTitle: 'Kumoko Scan - Catalog Service',
  docsDescription: 'Catalogo e leitura: obras, capitulos, paginas e capas.',
});
