import { Logger } from '@nestjs/common';
import type { Logger as TypeOrmLoggerContract } from 'typeorm';

/** Encaminha os logs do TypeORM para o Logger do Nest (pino), sem console.log. */
export class TypeOrmNestLogger implements TypeOrmLoggerContract {
  private readonly logger = new Logger('TypeORM');

  logQuery(query: string): void {
    this.logger.debug(`query: ${query}`);
  }

  logQueryError(error: string | Error, query: string): void {
    const message = error instanceof Error ? error.message : error;
    this.logger.error(`Falha na query: ${message} query=${query}`);
  }

  logQuerySlow(time: number, query: string): void {
    this.logger.warn(`Query lenta (${time}ms): ${query}`);
  }

  logSchemaBuild(message: string): void {
    this.logger.debug(message);
  }

  logMigration(message: string): void {
    this.logger.log(`Migration: ${message}`);
  }

  log(level: 'log' | 'info' | 'warn', message: unknown): void {
    const text = typeof message === 'string' ? message : JSON.stringify(message);
    if (level === 'warn') {
      this.logger.warn(text);
    } else {
      this.logger.log(text);
    }
  }
}
