import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';
import { TypeOrmNestLogger } from './typeorm-logger';

/** Referencia a uma classe (entity ou migration). Equivale ao `Function[]` do blueprint. */
export type ClassRef = abstract new (...args: never[]) => unknown;

interface DatabaseSettings {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

function baseOptions(
  settings: DatabaseSettings,
  migrations: ClassRef[],
  entities: ClassRef[],
): DataSourceOptions {
  return {
    type: 'mariadb',
    ...settings,
    charset: 'utf8mb4_unicode_ci',
    timezone: 'Z',
    entities,
    // Migrations importadas explicitamente: o build e webpack, glob de arquivos nao funciona.
    migrations,
    migrationsTableName: 'migrations',
    migrationsRun: true,
    synchronize: false,
    logging: ['error', 'warn', 'migration'],
    logger: new TypeOrmNestLogger(),
  };
}

/**
 * Opcoes do TypeOrmModule.forRootAsync lendo DB_* via ConfigService.
 * `autoLoadEntities` tambem registra as entities usadas em TypeOrmModule.forFeature().
 */
export function createTypeOrmOptions(
  migrations: ClassRef[],
  entities: ClassRef[],
): TypeOrmModuleAsyncOptions {
  return {
    inject: [ConfigService],
    useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
      ...baseOptions(
        {
          host: config.getOrThrow<string>('DB_HOST'),
          port: Number(config.get<number>('DB_PORT') ?? 3306),
          database: config.getOrThrow<string>('DB_NAME'),
          username: config.getOrThrow<string>('DB_USER'),
          password: config.getOrThrow<string>('DB_PASSWORD'),
        },
        migrations,
        entities,
      ),
      autoLoadEntities: true,
      retryAttempts: 10,
      retryDelay: 3000,
    }),
  };
}

/**
 * Opcoes para um DataSource standalone (ex.: `database/data-source.ts` usado pela CLI do TypeORM),
 * lendo DB_* de `process.env`.
 */
export function buildDataSourceOptions(
  env: NodeJS.ProcessEnv,
  migrations: ClassRef[],
  entities: ClassRef[],
): DataSourceOptions {
  const required = (name: string): string => {
    const value = env[name];
    if (!value) {
      throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
    }
    return value;
  };
  return baseOptions(
    {
      host: required('DB_HOST'),
      port: Number(env.DB_PORT ?? 3306),
      database: required('DB_NAME'),
      username: required('DB_USER'),
      password: required('DB_PASSWORD'),
    },
    migrations,
    entities,
  );
}
