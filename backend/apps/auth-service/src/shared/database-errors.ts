import { QueryFailedError } from 'typeorm';

interface MysqlDriverError {
  code?: string;
  errno?: number;
  sqlMessage?: string;
  message?: string;
}

/** Codigo do MariaDB/MySQL para violacao de chave unica. */
const ER_DUP_ENTRY = 1062;

/** Retorna true quando o erro e de chave duplicada (opcionalmente de um indice especifico). */
export function isDuplicateEntryError(error: unknown, indexName?: string): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }
  const driverError = error.driverError as MysqlDriverError | undefined;
  const duplicated = driverError?.code === 'ER_DUP_ENTRY' || driverError?.errno === ER_DUP_ENTRY;
  if (!duplicated) {
    return false;
  }
  if (!indexName) {
    return true;
  }
  const message = driverError?.sqlMessage ?? driverError?.message ?? error.message;
  return message.includes(indexName);
}
