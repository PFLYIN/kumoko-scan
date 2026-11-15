/** Criterios de ordenacao aceitos em GET /api/obras. */
export enum OrdenacaoObras {
  Recentes = 'recentes',
  Nome = 'nome',
  PrecoAsc = 'preco-asc',
  PrecoDesc = 'preco-desc',
  MaisVendidos = 'mais-vendidos',
}

export const ORDENACOES_OBRAS: readonly OrdenacaoObras[] = Object.values(OrdenacaoObras);
