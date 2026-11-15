/** Tipos de evento trafegados no Redis Pub/Sub (contrato entre servicos, ver blueprint §7). */
export const EventTypes = {
  OrderCompleted: 'order.completed',
  CatalogObraUpdated: 'catalog.obra.updated',
  CatalogObraDeleted: 'catalog.obra.deleted',
  UserRegistered: 'user.registered',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

export const ALL_EVENT_TYPES: readonly EventType[] = Object.values(EventTypes);

export const EVENT_CHANNEL_PREFIX = 'kumoko.events.';

/** Canal Redis de um tipo de evento: `kumoko.events.<type>`. */
export function channelForEvent(type: EventType): string {
  return `${EVENT_CHANNEL_PREFIX}${type}`;
}

export function isEventType(value: unknown): value is EventType {
  return typeof value === 'string' && (ALL_EVENT_TYPES as readonly string[]).includes(value);
}
