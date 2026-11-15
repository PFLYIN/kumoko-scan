export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Formato padrao de lista paginada: `{ data, meta: { page, limit, total, totalPages } }`. */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PageRequest {
  page: number;
  limit: number;
}

/** Converte page/limit em skip/take do TypeORM. */
export function toSkipTake({ page, limit }: PageRequest): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}

/** Monta a resposta paginada a partir dos itens da pagina e do total. */
export function paginate<T>(data: T[], total: number, { page, limit }: PageRequest): Paginated<T> {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
  };
}
