import { Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { CacheService } from './cache.service';

type RedisMock = {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  scan: jest.Mock;
  unlink: jest.Mock;
};

function createRedisMock(): RedisMock {
  return {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    scan: jest.fn(),
    unlink: jest.fn(),
  };
}

describe('CacheService', () => {
  let redis: RedisMock;
  let service: CacheService;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    redis = createRedisMock();
    service = new CacheService(redis as unknown as Redis);
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('getOrSet', () => {
    it('HIT: devolve o valor do Redis sem chamar o loader', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ id: 1, nome: 'Dandadan' }));
      const loader = jest.fn();

      const result = await service.getOrSet('catalog:obras:id:1', 60, loader);

      expect(result).toEqual({ value: { id: 1, nome: 'Dandadan' }, hit: true });
      expect(loader).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('Cache HIT key=catalog:obras:id:1');
    });

    it('MISS: chama o loader e grava com TTL', async () => {
      redis.get.mockResolvedValue(null);
      const loader = jest.fn().mockResolvedValue([1, 2, 3]);

      const result = await service.getOrSet('catalog:obras:list:abc', 60, loader);

      expect(result).toEqual({ value: [1, 2, 3], hit: false });
      expect(loader).toHaveBeenCalledTimes(1);
      expect(redis.set).toHaveBeenCalledWith('catalog:obras:list:abc', '[1,2,3]', 'EX', 60);
      expect(logSpy).toHaveBeenCalledWith('Cache MISS key=catalog:obras:list:abc ttl=60');
    });

    it('Redis fora do ar na leitura e na escrita: cai para o loader sem lancar erro', async () => {
      redis.get.mockRejectedValue(new Error('Connection is closed.'));
      redis.set.mockRejectedValue(new Error('Connection is closed.'));
      const loader = jest.fn().mockResolvedValue({ ok: true });

      const result = await service.getOrSet('k', 30, loader);

      expect(result).toEqual({ value: { ok: true }, hit: false });
      expect(loader).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it('valor corrompido no Redis e tratado como MISS', async () => {
      redis.get.mockResolvedValue('{nao-e-json');
      const loader = jest.fn().mockResolvedValue('origem');

      await expect(service.getOrSet('k', 30, loader)).resolves.toEqual({ value: 'origem', hit: false });
    });

    it('propaga erro do loader (falha da origem nao e mascarada)', async () => {
      redis.get.mockResolvedValue(null);
      const loader = jest.fn().mockRejectedValue(new Error('banco fora'));

      await expect(service.getOrSet('k', 30, loader)).rejects.toThrow('banco fora');
      expect(redis.set).not.toHaveBeenCalled();
    });
  });

  describe('invalidate', () => {
    it('remove a chave e loga a quantidade', async () => {
      await expect(service.invalidate('catalog:obras:id:1')).resolves.toBe(1);
      expect(redis.del).toHaveBeenCalledWith('catalog:obras:id:1');
    });

    it('nao lanca se o Redis falhar', async () => {
      redis.del.mockRejectedValue(new Error('down'));
      await expect(service.invalidate('k')).resolves.toBe(0);
    });
  });

  describe('invalidatePrefix', () => {
    it('percorre o SCAN ate o cursor voltar a 0 e remove com UNLINK', async () => {
      redis.scan
        .mockResolvedValueOnce(['17', ['catalog:obras:list:a', 'catalog:obras:id:1']])
        .mockResolvedValueOnce(['42', []])
        .mockResolvedValueOnce(['0', ['catalog:obras:id:2']]);
      redis.unlink.mockResolvedValueOnce(2).mockResolvedValueOnce(1);

      const removed = await service.invalidatePrefix('catalog:obras:');

      expect(removed).toBe(3);
      expect(redis.scan).toHaveBeenCalledTimes(3);
      expect(redis.scan).toHaveBeenNthCalledWith(1, '0', 'MATCH', 'catalog:obras:*', 'COUNT', 200);
      expect(redis.scan).toHaveBeenNthCalledWith(2, '17', 'MATCH', 'catalog:obras:*', 'COUNT', 200);
      expect(redis.unlink).toHaveBeenCalledTimes(2);
      expect(redis.unlink).toHaveBeenCalledWith('catalog:obras:list:a', 'catalog:obras:id:1');
      expect(logSpy).toHaveBeenCalledWith('Cache INVALIDATE prefix=catalog:obras: removidas=3');
    });

    it('escapa caracteres de glob do prefixo', async () => {
      redis.scan.mockResolvedValueOnce(['0', []]);
      await service.invalidatePrefix('orders:catalog-precos:[1]*');
      expect(redis.scan).toHaveBeenCalledWith(
        '0',
        'MATCH',
        'orders:catalog-precos:\\[1\\]\\**',
        'COUNT',
        200,
      );
    });

    it('nao lanca se o Redis falhar no meio da varredura', async () => {
      redis.scan.mockRejectedValue(new Error('down'));
      await expect(service.invalidatePrefix('catalog:')).resolves.toBe(0);
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
