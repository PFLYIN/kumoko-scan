import type { EventBus } from '@kumoko/messaging';
import { QueryFailedError, type DataSource, type EntityManager } from 'typeorm';
import { EventoProcessado } from '../entities/evento-processado.entity';
import { User } from '../entities/user.entity';
import { PedidoConcluidoListener } from './pedido-concluido.listener';

describe('PedidoConcluidoListener', () => {
  let manager: { insert: jest.Mock; increment: jest.Mock };
  let transaction: jest.Mock;
  let eventBus: { subscribe: jest.Mock };
  let listener: PedidoConcluidoListener;
  const envelope = { id: '6f1c1d1e-0000-4000-8000-000000000001', type: 'order.completed' as const };
  const payload = { pedidoId: 12, usuarioId: 3, total: 89.7, itens: [] };

  beforeEach(() => {
    manager = {
      insert: jest.fn().mockResolvedValue({}),
      increment: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    transaction = jest.fn((cb: (m: EntityManager) => unknown) => cb(manager as unknown as EntityManager));
    eventBus = { subscribe: jest.fn() };
    listener = new PedidoConcluidoListener(
      eventBus as unknown as EventBus,
      { transaction } as unknown as DataSource,
    );
  });

  it('assina order.completed no init', () => {
    listener.onModuleInit();
    expect(eventBus.subscribe).toHaveBeenCalledWith('order.completed', expect.any(Function));
  });

  it('registra o evento e incrementa total_gasto de forma atomica', async () => {
    await expect(listener.handle(payload, envelope)).resolves.toBe('processado');
    expect(manager.insert).toHaveBeenCalledWith(EventoProcessado, {
      eventId: envelope.id,
      tipo: 'order.completed',
    });
    expect(manager.increment).toHaveBeenCalledWith(User, { id: 3 }, 'totalGasto', '89.70');
  });

  it('ignora evento duplicado (idempotencia) sem incrementar', async () => {
    manager.insert.mockRejectedValue(
      new QueryFailedError('INSERT', [], { code: 'ER_DUP_ENTRY', errno: 1062 } as never),
    );
    await expect(listener.handle(payload, envelope)).resolves.toBe('duplicado');
    expect(manager.increment).not.toHaveBeenCalled();
  });

  it('usuario inexistente apenas avisa', async () => {
    manager.increment.mockResolvedValue({ affected: 0 });
    await expect(listener.handle(payload, envelope)).resolves.toBe('usuario-inexistente');
  });

  it('payload invalido lanca erro (logado pelo EventBus)', async () => {
    await expect(listener.handle({ ...payload, total: Number.NaN }, envelope)).rejects.toThrow(
      'Payload invalido',
    );
    expect(transaction).not.toHaveBeenCalled();
  });

  it('propaga erros de banco que nao sao duplicidade', async () => {
    manager.insert.mockRejectedValue(new Error('conexao perdida'));
    await expect(listener.handle(payload, envelope)).rejects.toThrow('conexao perdida');
  });
});
