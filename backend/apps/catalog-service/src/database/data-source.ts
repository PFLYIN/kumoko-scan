import { buildDataSourceOptions } from '@kumoko/common';
import { DataSource } from 'typeorm';
import { CATALOG_ENTITIES, CATALOG_MIGRATIONS } from './catalog-schema';

/**
 * DataSource standalone para a CLI do TypeORM (migration:show / migration:revert).
 * Le DB_* de process.env. O servico em si roda as migrations no boot (migrationsRun: true).
 */
export default new DataSource(buildDataSourceOptions(process.env, CATALOG_MIGRATIONS, CATALOG_ENTITIES));
