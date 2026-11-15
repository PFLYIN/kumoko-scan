/** Prefixo publico servido pelo gateway a partir do volume de uploads. */
export const PUBLIC_FILES_PREFIX = '/files/';

/** Normaliza um caminho relativo para barras '/', sem barras iniciais. */
export function toPosixRelative(relativePath: string): string {
  return relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
}

/** URL publica de um arquivo salvo em UPLOADS_DIR (`/files/<caminho relativo>`), ou null. */
export function toPublicFileUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) {
    return null;
  }
  return `${PUBLIC_FILES_PREFIX}${toPosixRelative(relativePath)}`;
}
