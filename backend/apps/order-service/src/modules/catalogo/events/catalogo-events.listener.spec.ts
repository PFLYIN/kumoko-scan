import type { CacheService } from '@kumoko/cache';
import { type EventBus, EventTypes, type ObraChangedPayload } from '@kumoko/messaging';
import { CatalogoEventsListener } from './catalogo-events.listener';

describe('CatalogoEventsListener', () => {
  const subscribe = jest.fn();
  const invalidatePrefix = jest.fn().mockResolvedValue(2);
  const listener = new CatalogoEventsListener(
    { subscribe } as unknown as EventBus,
    { invalidatePrefix } as unknown as CacheService,
  );

  it('assina catalog.obra.updated, catalog.obra.deleted e user.registered', () => {
    listener.onModuleInit();
    expect(subscribe.mock.calls.map((call) => call[0])).toEqual([
      EventTypes.CatalogObraUpdated,
      EventTypes.CatalogObraDeleted,
      EventTypes.UserRegistered,
    ]);
  });

  it.each([EventTypes.CatalogObraUpdated, EventTypes.CatalogObraDeleted])(
    '%s invalida o cache de precos',
    async (type) => {
      invalidatePrefix.mockClear();
      const handler = subscribe.mock.calls.find((call) => call[0] === type)?.[1];
      const payload: ObraChangedPayload = { obraId: 3, tipo: 'manga', preco: 10 };
      await handler(payload, { id: 'e1', type, payload });
      expect(invalidatePrefix).toHaveBeenCalledWith('orders:catalog-precos:');
    },
  );

  it('user.registered apenas registra log', () => {
    invalidatePrefix.mockClear();
    expect(() => listener.onUsuarioRegistrado({ usuarioId: 9, email: 'a@b.c' })).not.toThrow();
    expect(invalidatePrefix).not.toHaveBeenCalled();
  });
});
