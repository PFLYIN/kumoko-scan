import { randomUUID } from 'node:crypto';

/**
 * Gera um nome de arquivo imprevisivel e sem caracteres perigosos: `<timestamp>-<uuid>.<ext>`.
 * Nunca use o nome original enviado pelo cliente para gravar em disco.
 */
export function generateSafeFileName(ext: string): string {
  const normalized = ext.replace(/^\./, '').toLowerCase();
  if (!/^[a-z0-9]{1,5}$/.test(normalized)) {
    throw new Error(`Extensao de arquivo invalida: ${ext}`);
  }
  const finalExt = normalized === 'jpeg' ? 'jpg' : normalized;
  return `${Date.now()}-${randomUUID()}.${finalExt}`;
}
