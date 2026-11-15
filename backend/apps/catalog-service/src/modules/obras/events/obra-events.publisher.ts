import { Injectable } from '@nestjs/common';
import { EventBus, EventTypes, type ObraChangedPayload } from '@kumoko/messaging';
import { toTipoObraContrato } from '../domain/tipo-obra';
import type { Obra } from '../entities/obra.entity';

/** Publica catalog.obra.updated / catalog.obra.deleted (consumidos pelo order-service). */
@Injectable()
export class ObraEventsPublisher {
  constructor(private readonly eventBus: EventBus) {}

  async obraAtualizada(obra: Obra): Promise<void> {
    await this.eventBus.publish<ObraChangedPayload>(EventTypes.CatalogObraUpdated, {
      obraId: obra.id,
      tipo: toTipoObraContrato(obra.tipo),
      preco: Number(obra.preco),
    });
  }

  async obraExcluida(obra: Pick<Obra, 'id' | 'tipo'>): Promise<void> {
    await this.eventBus.publish<ObraChangedPayload>(EventTypes.CatalogObraDeleted, {
      obraId: obra.id,
      tipo: toTipoObraContrato(obra.tipo),
    });
  }
}
