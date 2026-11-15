import type { CacheService } from '@kumoko/cache';
import type { EventBus, EventEnvelope, OrderCompletedPayload } from '@kumoko/messaging';
import type { DataSource, EntityManager } from 'typeorm';
import { Obra } from '../entities/obra.entity';
import { EventoProcessado } from '../entities/evento-processado.entity';
import { OrderCompletedListener, somarQuantidadesPorObra } from './order-completed.listener';

const payload: OrderCompletedPayload = {
  pedidoId: 5,
  usuarioId: 3,
  total: 100,
  itens: [
    { obraId: 1, quantidade: 2, precoUnitario: 10 },
    { obraId: 2, quantidade: 1, precoUnitario: 20 },
    { obraId: 1, quantidade: 3, precoUnitario: 10 },
  ],
};

function envelope(id: string): EventEnvelope<OrderCompletedPayload> {
  return { id, type: 'order.completed', source: 'order-service', occurredAt: '', correlationId: id, payload };
}

function setup() {
  const processados = new Set<string>();
  const vendidos = new Map<number, number>();
  const manager = {
    insert: jest.fn(async (_entity: unknown, row: { eventId: string }) => {
      if (processados.has(row.eventId)) {
        throw Object.assign(new Error('Duplicate entry'), { code: 'ER_DUP_ENTRY', errno: 1062 });
      }
      processados.add(row.eventId);
    }),
    increment: jest.fn(async (_e: unknown, where: { id: number }, _col: string, qtd: number) => {
      vendidos.set(where.id, (vendidos.get(where.id) ?? 0) + qtd);
    }),
  };
  const dataSource = {
    transaction: jest.fn(async (fn: (m: EntityManager) => Promise<void>) =>
      fn(manager as unknown as EntityManager),
    ),
  };
  const cache = { invalidatePrefix: jest.fn().mockResolvedValue(3) };
  const bus = { subscribe: jest.fn() };
  const listener = new OrderCompletedListener(
    bus as unknown as EventBus,
    dataSource as unknown as DataSource,
    cache as unknown as CacheService,
  );
  return { listener, manager, cache, bus, vendidos };
}

describe('OrderCompletedListener', () => {
  it('assina order.completed no onModuleInit', () => {
    const { listener, bus } = setup();
    listener.onModuleInit();
    expect(bus.subscribe).toHaveBeenCalledWith('order.completed', expect.any(Function));
  });

  it('soma quantidades por obra na transacao e invalida catalog:obras:', async () => {
    const { listener, manager, cache, vendidos } = setup();
    await expect(listener.handle(payload, envelope('e1'))).resolves.toBe(true);
    expect(manager.insert).toHaveBeenCalledWith(EventoProcessado, { eventId: 'e1', tipo: 'order.completed' });
    expect(manager.increment).toHaveBeenCalledWith(Obra, { id: 1 }, 'totalVendido', 5);
    expect(vendidos).toEqual(
      new Map([
        [1, 5],
        [2, 1],
      ]),
    );
    expect(cache.invalidatePrefix).toHaveBeenCalledWith('catalog:obras:');
  });

  it('e idempotente: o mesmo envelope.id nao incrementa duas vezes', async () => {
    const { listener, cache, vendidos } = setup();
    await listener.handle(payload, envelope('e1'));
    await expect(listener.handle(payload, envelope('e1'))).resolves.toBe(false);
    expect(vendidos.get(1)).toBe(5);
    expect(cache.invalidatePrefix).toHaveBeenCalledTimes(1);
  });

  it('propaga erros que nao sao de duplicidade (EventBus loga a falha)', async () => {
    const { listener, manager } = setup();
    manager.increment.mockRejectedValueOnce(new Error('deadlock'));
    await expect(listener.handle(payload, envelope('e2'))).rejects.toThrow('deadlock');
  });

  it('somarQuantidadesPorObra descarta itens malformados', () => {
    const totais = somarQuantidadesPorObra({
      ...payload,
      itens: [
        { obraId: 1, quantidade: 0, precoUnitario: 1 },
        { obraId: -1, quantidade: 1, precoUnitario: 1 },
        { obraId: 4, quantidade: 2, precoUnitario: 1 },
      ],
    });
    expect([...totais]).toEqual([[4, 2]]);
  });
});
