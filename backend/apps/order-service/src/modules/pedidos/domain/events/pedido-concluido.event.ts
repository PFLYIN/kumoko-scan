import type { Dinheiro } from '../dinheiro';

/** Contrato minimo de um domain event. */
export interface DomainEvent {
  readonly nome: string;
  readonly ocorridoEm: Date;
}

export interface ItemConcluido {
  readonly obraId: number;
  readonly quantidade: number;
  readonly precoUnitario: Dinheiro;
}

/**
 * Domain event: um pedido foi concluido (pago/registrado).
 * A camada de aplicacao o traduz para o evento de integracao `order.completed`.
 */
export class PedidoConcluido implements DomainEvent {
  readonly nome = 'PedidoConcluido';

  constructor(
    readonly pedidoId: number,
    readonly usuarioId: number,
    readonly total: Dinheiro,
    readonly itens: readonly ItemConcluido[],
    readonly ocorridoEm: Date,
  ) {}
}
