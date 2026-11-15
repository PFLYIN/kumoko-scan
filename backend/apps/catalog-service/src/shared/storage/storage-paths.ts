/** Layout das pastas dentro de UPLOADS_DIR (blueprint §8). Sempre com '/', relativo a raiz. */
export const StoragePaths = {
  coversDir: 'covers',
  obraPagesDir(obraId: number): string {
    return `pages/obra_${obraId}`;
  },
  capituloPagesDir(obraId: number, capituloId: number): string {
    return `pages/obra_${obraId}/capitulo_${capituloId}`;
  },
} as const;
