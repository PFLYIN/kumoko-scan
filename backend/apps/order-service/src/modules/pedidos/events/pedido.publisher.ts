import { Injectable } from '@nestjs/common';
import { EventBus, EventTypes, type OrderCompletedPayload } from '@kumoko/messaging';
import type { DomainEvent } from '../domain/events/pedido-concluido.event';
import { PedidoConcluido } from '../domain/events/pedido-concluido.event';

/** Traduz domain events do aggregate em eventos de integracao (Redis Pub/Sub). */
@Injectable()
export class PedidoEventsPublisher {
  constructor(private readonly eventBus: EventBus) {}

  async publicar(events: readonly DomainEvent[]): Promise<void> {
    for (const event of events) {
      if (event instanceof PedidoConcluido) {
        await this.eventBus.publish<OrderCompletedPayload>(
          EventTypes.OrderCompleted,
          toOrderCompleted(event),
        );
      }
    }
  }
}

export function toOrderCompleted(event: PedidoConcluido): OrderCompletedPayload {
  return {
    pedidoId: event.pedidoId,
    usuarioId: event.usuarioId,
    total: event.total.toNumber(),
    itens: event.itens.map((item) => ({
      obraId: item.obraId,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario.toNumber(),
    })),
  };
}
