/** Detecta violacao de UNIQUE do MariaDB/MySQL (ER_DUP_ENTRY, errno 1062) vinda do TypeORM/mysql2. */
export function isDuplicateEntryError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as {
    code?: unknown;
    errno?: unknown;
    driverError?: { code?: unknown; errno?: unknown };
  };
  const code = candidate.code ?? candidate.driverError?.code;
  const errno = candidate.errno ?? candidate.driverError?.errno;
  return code === 'ER_DUP_ENTRY' || errno === 1062;
}
