/** Numero maximo de obras distintas em um pedido. */
export const MAX_ITENS_DISTINTOS = 20;

export const STATUS_PEDIDO = ['CONCLUIDO', 'CANCELADO'] as const;

export type StatusPedido = (typeof STATUS_PEDIDO)[number];

export const TIPOS_OBRA = ['manga', 'livro', 'novel'] as const;

/** Tipo da obra no vocabulario do contexto de Vendas (espelha o catalogo, mas pertence a este dominio). */
export type TipoObra = (typeof TIPOS_OBRA)[number];

/** Limites de quantidade por obra em um pedido. */
export const QUANTIDADE_MINIMA = 1;
export const QUANTIDADE_MAXIMA = 99;
