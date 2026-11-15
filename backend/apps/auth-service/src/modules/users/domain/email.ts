/** Normaliza e-mail para comparacao e persistencia (trim + minusculas). */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Mascara o e-mail para logs (ex.: `p***@kumoko.local`), evitando expor o dado completo. */
export function maskEmail(value: string): string {
  const [local, domain] = value.split('@');
  if (!local || !domain) {
    return '***';
  }
  return `${local[0]}***@${domain}`;
}
