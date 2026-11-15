import { type EventType, isEventType } from './event-types';

/** Envelope publicado em todo evento. */
export interface EventEnvelope<T = unknown> {
  id: string;
  type: EventType;
  source: string;
  occurredAt: string;
  correlationId: string;
  payload: T;
}

/** Validacao estrutural minima de uma mensagem recebida do Redis. */
export function isEventEnvelope(value: unknown): value is EventEnvelope {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const data = value as Record<string, unknown>;
  return (
    typeof data.id === 'string' &&
    isEventType(data.type) &&
    typeof data.source === 'string' &&
    typeof data.occurredAt === 'string' &&
    'payload' in data
  );
}
