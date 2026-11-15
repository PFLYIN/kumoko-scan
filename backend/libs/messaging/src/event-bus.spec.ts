import { Logger } from '@nestjs/common';
import { getRequestId, runWithRequestContext } from '@kumoko/observability';
import type { Redis } from 'ioredis';
import { EventEmitter } from 'node:events';
import type { EventEnvelope } from './contracts/event-envelope';
import { EventTypes } from './contracts/event-types';
import type { OrderCompletedPayload } from './contracts/payloads';
import { EventBus } from './event-bus';

class SubscriberMock extends EventEmitter {
  subscribe = jest.fn().mockResolvedValue(1);
}

const payload: OrderCompletedPayload = {
  pedidoId: 12,
  usuarioId: 3,
  total: 89.7,
  itens: [{ obraId: 5, quantidade: 3, precoUnitario: 29.9 }],
};

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('EventBus', () => {
  let publisher: { publish: jest.Mock };
  let subscriber: SubscriberMock;
  let bus: EventBus;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    publisher = { publish: jest.fn().mockResolvedValue(2) };
    subscriber = new SubscriberMock();
    bus = new EventBus(publisher as unknown as Redis, subscriber as unknown as Redis, {
      serviceName: 'order-service',
    });
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    bus.onModuleDestroy();
    jest.restoreAllMocks();
  });

  describe('publish', () => {
    it('monta o envelope e publica no canal kumoko.events.<type>', async () => {
      const envelope = await bus.publish(EventTypes.OrderCompleted, payload);

      expect(envelope).toMatchObject({
        type: 'order.completed',
        source: 'order-service',
        payload,
      });
      expect(envelope.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(new Date(envelope.occurredAt).toISOString()).toBe(envelope.occurredAt);
      // Fora de uma request, a correlacao usa o proprio id do evento.
      expect(envelope.correlationId).toBe(envelope.id);

      expect(publisher.publish).toHaveBeenCalledTimes(1);
      const [channel, message] = publisher.publish.mock.calls[0] as [string, string];
      expect(channel).toBe('kumoko.events.order.completed');
      expect(JSON.parse(message)).toEqual(envelope);
    });

    it('propaga o request id atual como correlationId', async () => {
      const envelope = await runWithRequestContext({ requestId: 'req-123' }, () =>
        bus.publish(EventTypes.UserRegistered, { usuarioId: 1, email: 'a@k.local' }),
      );
      expect(envelope.correlationId).toBe('req-123');
    });

    it('nao lanca se o Redis falhar ao publicar (loga erro)', async () => {
      publisher.publish.mockRejectedValue(new Error('Connection is closed.'));
      await expect(
        bus.publish(EventTypes.CatalogObraUpdated, { obraId: 1, tipo: 'manga' }),
      ).resolves.toBeDefined();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    const envelopeFor = (overrides: Partial<EventEnvelope<OrderCompletedPayload>> = {}) =>
      JSON.stringify({
        id: 'evt-1',
        type: 'order.completed',
        source: 'order-service',
        occurredAt: new Date().toISOString(),
        correlationId: 'req-999',
        payload,
        ...overrides,
      });

    it('assina o canal uma unica vez por tipo', async () => {
      bus.subscribe(EventTypes.OrderCompleted, jest.fn());
      bus.subscribe(EventTypes.OrderCompleted, jest.fn());
      await flushPromises();
      expect(subscriber.subscribe).toHaveBeenCalledTimes(1);
      expect(subscriber.subscribe).toHaveBeenCalledWith('kumoko.events.order.completed');
    });

    it('entrega payload e envelope ao handler dentro do contexto de correlacao', async () => {
      let correlation: string | undefined;
      const handler = jest.fn(() => {
        correlation = getRequestId();
      });
      bus.subscribe<OrderCompletedPayload>(EventTypes.OrderCompleted, handler);

      await bus.handleMessage('kumoko.events.order.completed', envelopeFor());

      expect(handler).toHaveBeenCalledWith(payload, expect.objectContaining({ id: 'evt-1' }));
      expect(correlation).toBe('req-999');
    });

    it('recebe via evento "message" do ioredis', async () => {
      const handler = jest.fn();
      bus.subscribe(EventTypes.OrderCompleted, handler);

      subscriber.emit('message', 'kumoko.events.order.completed', envelopeFor());
      await flushPromises();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('erro no handler e logado e nao impede os demais handlers', async () => {
      const failing = jest.fn().mockRejectedValue(new Error('falha no banco'));
      const next = jest.fn();
      bus.subscribe(EventTypes.OrderCompleted, failing);
      bus.subscribe(EventTypes.OrderCompleted, next);

      await expect(
        bus.handleMessage('kumoko.events.order.completed', envelopeFor()),
      ).resolves.toBeUndefined();

      expect(failing).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Falha ao processar evento type=order.completed id=evt-1'),
        expect.any(String),
      );
    });

    it('ignora mensagens malformadas sem chamar o handler', async () => {
      const handler = jest.fn();
      bus.subscribe(EventTypes.OrderCompleted, handler);

      await bus.handleMessage('kumoko.events.order.completed', '{nao-json');
      await bus.handleMessage('kumoko.events.order.completed', JSON.stringify({ foo: 'bar' }));
      await bus.handleMessage(
        'kumoko.events.order.completed',
        envelopeFor({ type: 'desconhecido' as never }),
      );

      expect(handler).not.toHaveBeenCalled();
    });

    it('ignora canais sem handler registrado', async () => {
      await expect(
        bus.handleMessage('kumoko.events.user.registered', envelopeFor()),
      ).resolves.toBeUndefined();
    });
  });
});
