import { createHash } from 'node:crypto';

/** Prefixo comum a todas as chaves de obra (listagens, detalhe e capitulos). */
export const OBRAS_CACHE_PREFIX = 'catalog:obras:';

/** Chaves de cache do catalogo (contrato do blueprint §8; scripts de demo dependem delas). */
export const CatalogCacheKeys = {
  /** `catalog:obras:list:<hash-dos-filtros>` */
  obrasList(filtros: Record<string, unknown>): string {
    const normalizado = Object.keys(filtros)
      .sort()
      .map((chave) => [chave, filtros[chave] ?? null]);
    const hash = createHash('sha1').update(JSON.stringify(normalizado)).digest('hex').slice(0, 16);
    return `${OBRAS_CACHE_PREFIX}list:${hash}`;
  },
  /** `catalog:obras:id:<id>` */
  obra(id: number): string {
    return `${OBRAS_CACHE_PREFIX}id:${id}`;
  },
  /** `catalog:obras:capitulos:<obraId>` (chave exata: invalidar com invalidate, nunca por prefixo). */
  capitulos(obraId: number): string {
    return `${OBRAS_CACHE_PREFIX}capitulos:${obraId}`;
  },
  /** `catalog:capitulos:paginas:<capituloId>` */
  paginas(capituloId: number): string {
    return `catalog:capitulos:paginas:${capituloId}`;
  },
} as const;
