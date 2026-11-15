const UNIT_IN_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

/** Formato aceito para JWT_EXPIRES_IN: numero de segundos ou numero + unidade (s, m, h, d). */
export const DURATION_PATTERN = /^(\d+)([smhd])?$/;

/** Converte '1h', '15m', '7d', '3600' em segundos. Lanca erro se o formato for invalido. */
export function parseDurationToSeconds(value: string | number): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`Duracao invalida: ${value}`);
    }
    return Math.floor(value);
  }
  const match = DURATION_PATTERN.exec(value.trim());
  if (!match) {
    throw new Error(`Duracao invalida: ${value}`);
  }
  const amount = Number(match[1]);
  const unit = match[2] ?? 's';
  const seconds = amount * UNIT_IN_SECONDS[unit];
  if (seconds <= 0) {
    throw new Error(`Duracao invalida: ${value}`);
  }
  return seconds;
}
