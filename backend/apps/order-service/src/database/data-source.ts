import { buildDataSourceOptions } from '@kumoko/common';
import { DataSource } from 'typeorm';
import { ORDER_ENTITIES } from './entities';
import { ORDER_MIGRATIONS } from './migrations';

/**
 * DataSource para a CLI do TypeORM (ex.: `typeorm migration:show -d <arquivo compilado>`),
 * lendo DB_* de process.env. Nao e importado pela aplicacao (que usa createTypeOrmOptions).
 */
export default new DataSource(buildDataSourceOptions(process.env, ORDER_MIGRATIONS, ORDER_ENTITIES));
