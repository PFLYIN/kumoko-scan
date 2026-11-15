import type { IdempotencyKey } from './idempotency-key';
import type { Pedido } from './pedido';

/** Token de injecao do repositorio (a implementacao TypeORM fica em repositories/). */
export const PEDIDO_REPOSITORY = Symbol('PEDIDO_REPOSITORY');

export interface PaginaPedidos {
  pedidos: Pedido[];
  total: number;
}

/**
 * Port (DDD) do repositorio do aggregate Pedido. O dominio e o caso de uso dependem
 * apenas desta interface.
 */
export interface PedidoRepository {
  /**
   * Persiste o pedido novo (raiz + itens em uma transacao) e atribui o id ao aggregate.
   * Lanca IdempotenciaConflitoError se ja existir pedido do usuario com a mesma chave.
   */
  salvar(pedido: Pedido): Promise<Pedido>;

  buscarPorId(id: number): Promise<Pedido | null>;

  buscarPorIdempotencyKey(usuarioId: number, chave: IdempotencyKey): Promise<Pedido | null>;

  /** Pedidos do usuario, mais recentes primeiro. */
  listarPorUsuario(usuarioId: number, pagina: { page: number; limit: number }): Promise<PaginaPedidos>;
}
