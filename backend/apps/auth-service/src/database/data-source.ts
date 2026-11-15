import { buildDataSourceOptions } from '@kumoko/common';
import { DataSource } from 'typeorm';
import { EventoProcessado } from '../modules/users/entities/evento-processado.entity';
import { User } from '../modules/users/entities/user.entity';
import { AUTH_MIGRATIONS } from './migrations';

/** DataSource para a CLI do TypeORM (ex.: migration:run / migration:revert), lendo DB_* do ambiente. */
export const AUTH_ENTITIES = [User, EventoProcessado];

export default new DataSource(buildDataSourceOptions(process.env, AUTH_MIGRATIONS, AUTH_ENTITIES));
