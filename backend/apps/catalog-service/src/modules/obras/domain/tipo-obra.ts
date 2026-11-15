import type { TipoObra as TipoObraContrato } from '@kumoko/messaging';

/** Tipos de obra do catalogo (mesmos valores do contrato de eventos). */
export enum TipoObra {
  Manga = 'manga',
  Livro = 'livro',
  Novel = 'novel',
}

export const TIPOS_OBRA: readonly TipoObra[] = Object.values(TipoObra);

/** Converte para o tipo do contrato de eventos (falha de compilacao se os valores divergirem). */
export function toTipoObraContrato(tipo: TipoObra): TipoObraContrato {
  return tipo;
}

/** Somente mangas e light novels sao numerados por volume. */
export function tipoAceitaVolume(tipo: TipoObra): boolean {
  return tipo === TipoObra.Manga || tipo === TipoObra.Novel;
}
