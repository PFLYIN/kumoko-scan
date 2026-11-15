import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { CacheService } from '@kumoko/cache';
import {
  EventBus,
  type EventEnvelope,
  EventTypes,
  type ObraChangedPayload,
  type UserRegisteredPayload,
} from '@kumoko/messaging';
import { CATALOG_PRECOS_CACHE_PREFIX } from '../catalogo.constants';

/**
 * Consome eventos de outros contextos:
 * - catalog.obra.updated/deleted -> invalida o cache de precos (preco do pedido sempre atual);
 * - user.registered -> apenas log de auditoria.
 */
@Injectable()
export class CatalogoEventsListener implements OnModuleInit {
  private readonly logger = new Logger(CatalogoEventsListener.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly cache: CacheService,
  ) {}

  onModuleInit(): void {
    this.eventBus.subscribe<ObraChangedPayload>(EventTypes.CatalogObraUpdated, (payload, envelope) =>
      this.onObraAlterada(payload, envelope),
    );
    this.eventBus.subscribe<ObraChangedPayload>(EventTypes.CatalogObraDeleted, (payload, envelope) =>
      this.onObraAlterada(payload, envelope),
    );
    this.eventBus.subscribe<UserRegisteredPayload>(EventTypes.UserRegistered, (payload) =>
      this.onUsuarioRegistrado(payload),
    );
  }

  async onObraAlterada(
    payload: ObraChangedPayload,
    envelope: EventEnvelope<ObraChangedPayload>,
  ): Promise<void> {
    const removidas = await this.cache.invalidatePrefix(CATALOG_PRECOS_CACHE_PREFIX);
    this.logger.log(
      `Cache de precos invalidado evento=${envelope.type} obraId=${payload?.obraId} removidas=${removidas}`,
    );
  }

  onUsuarioRegistrado(payload: UserRegisteredPayload): void {
    this.logger.log(`Novo cliente registrado usuarioId=${payload?.usuarioId}`);
  }
}
