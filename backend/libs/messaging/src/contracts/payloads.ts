import type { EventTypes } from './event-types';

export type TipoObra = 'manga' | 'livro' | 'novel';

export interface OrderCompletedItem {
  obraId: number;
  quantidade: number;
  precoUnitario: number;
}

/** order.completed: publicado pelo order-service; consumido por auth-service e catalog-service. */
export interface OrderCompletedPayload {
  pedidoId: number;
  usuarioId: number;
  total: number;
  itens: OrderCompletedItem[];
}

/** catalog.obra.updated / catalog.obra.deleted: publicado pelo catalog-service; consumido pelo order-service. */
export interface ObraChangedPayload {
  obraId: number;
  tipo: TipoObra;
  preco?: number;
}

/** user.registered: publicado pelo auth-service; apenas log/auditoria no order-service. */
export interface UserRegisteredPayload {
  usuarioId: number;
  email: string;
}

/** Mapa tipo -> payload, util para tipar handlers: `EventPayloadMap['order.completed']`. */
export interface EventPayloadMap {
  [EventTypes.OrderCompleted]: OrderCompletedPayload;
  [EventTypes.CatalogObraUpdated]: ObraChangedPayload;
  [EventTypes.CatalogObraDeleted]: ObraChangedPayload;
  [EventTypes.UserRegistered]: UserRegisteredPayload;
}
