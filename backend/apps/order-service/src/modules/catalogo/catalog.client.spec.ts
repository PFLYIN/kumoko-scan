import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { CacheService } from '@kumoko/cache';
import { MetricsService } from '@kumoko/observability';
import { AxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import { CatalogClient } from './catalog.client';
import { calcularBackoffMs, classificarFalha } from './retry-policy';

function httpError(status: number): AxiosError {
  const response = { status, statusText: 'x', data: {}, headers: {}, config: {} } as AxiosResponse;
  return new AxiosError(`HTTP ${status}`, 'ERR_BAD_RESPONSE', undefined, undefined, response);
}

function obra(id: number, preco: number | string = 29.9) {
  return { id, nome: `Obra ${id}`, tipo: 'manga', preco, capaUrl: null, avaliacao: 5, totalVendido: 0 };
}

describe('CatalogClient', () => {
  let get: jest.Mock;
  let sleep: jest.Mock;
  let cacheStore: Map<string, unknown>;
  let cache: CacheService;
  let client: CatalogClient;

  function criarCliente(retries = 2): CatalogClient {
    const config = {
      get: (key: string) => ({ CATALOG_RETRIES: retries, CATALOG_TIMEOUT_MS: 200 })[key],
    } as unknown as ConfigService;
    return new CatalogClient({ get } as unknown as AxiosInstance, cache, config, sleep);
  }

  beforeEach(() => {
    get = jest.fn();
    sleep = jest.fn().mockResolvedValue(undefined);
    cacheStore = new Map();
    cache = {
      getOrSet: jest.fn(async (key: string, _ttl: number, loader: () => Promise<unknown>) => {
        if (cacheStore.has(key)) {
          return { value: cacheStore.get(key), hit: true };
        }
        const value = await loader();
        cacheStore.set(key, value);
        return { value, hit: false };
      }),
    } as unknown as CacheService;
    client = criarCliente();
  });

  afterEach(() => client.onModuleDestroy());

  it('traduz ObraResponse para ObraRef + Dinheiro e usa ids ordenados na chave', async () => {
    get.mockResolvedValue({ data: [obra(3, '19.90'), obra(1)] });
    const obras = await client.buscarObras([3, 1, 3]);
    expect(get).toHaveBeenCalledWith('/api/obras/lote', expect.objectContaining({ params: { ids: '1,3' } }));
    expect(cache.getOrSet).toHaveBeenCalledWith('orders:catalog-precos:1,3', 30, expect.any(Function));
    expect(obras.get(3)?.preco.centavos).toBe(1990);
    expect(obras.get(1)?.obra.nome).toBe('Obra 1');
  });

  it('cache hit evita a chamada HTTP', async () => {
    get.mockResolvedValue({ data: [obra(1)] });
    await client.buscarObras([1]);
    await client.buscarObras([1]);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('faz retry com backoff em 5xx e depois sucede', async () => {
    get.mockRejectedValueOnce(httpError(500)).mockResolvedValueOnce({ data: [obra(1)] });
    const obras = await client.buscarObras([1]);
    expect(obras.size).toBe(1);
    expect(get).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('faz retry em timeout e lanca 503 apos esgotar tentativas', async () => {
    get.mockRejectedValue(new AxiosError('timeout', 'ECONNABORTED'));
    await expect(client.buscarObras([1])).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(get).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it.each([400, 404])('nao faz retry em %p', async (status) => {
    get.mockRejectedValue(httpError(status));
    await expect(client.buscarObras([1])).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(get).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(client.estadoCircuito).toBe('CLOSED');
  });

  it('abre o circuito apos falhas e passa a falhar rapido com 503', async () => {
    get.mockRejectedValue(httpError(503));
    await expect(client.buscarObras([1])).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(client.estadoCircuito).toBe('OPEN');
    get.mockClear();
    await expect(client.buscarObras([2])).rejects.toThrow('Catálogo indisponível no momento');
    expect(get).not.toHaveBeenCalled();
  });

  it('publica o estado do circuito no gauge circuit_breaker_state', async () => {
    const metrics = new MetricsService({ serviceName: 'order-service' });
    const config = {
      get: (key: string) => ({ CATALOG_RETRIES: 2, CATALOG_TIMEOUT_MS: 200 })[key],
    } as unknown as ConfigService;
    const comMetricas = new CatalogClient({ get } as unknown as AxiosInstance, cache, config, sleep, metrics);
    const estado = async () => (await metrics.circuitBreakerState.get()).values[0];
    try {
      expect(await estado()).toMatchObject({ value: 0, labels: { target: 'catalog-service' } });
      get.mockRejectedValue(httpError(503));
      await expect(comMetricas.buscarObras([1])).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(await estado()).toMatchObject({ value: 2 });
    } finally {
      comMetricas.onModuleDestroy();
    }
  });

  it('resposta fora do contrato vira 502 sem retry', async () => {
    get.mockResolvedValue({ data: { erro: 'x' } });
    await expect(client.buscarObras([1])).rejects.toBeInstanceOf(BadGatewayException);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('lista vazia nao chama o catalogo', async () => {
    expect((await client.buscarObras([])).size).toBe(0);
    expect(get).not.toHaveBeenCalled();
  });
});

describe('retry-policy', () => {
  it('classifica 5xx/rede como retentavel e 4xx nao', () => {
    expect(classificarFalha(httpError(502)).retriable).toBe(true);
    expect(classificarFalha(httpError(422)).retriable).toBe(false);
    expect(classificarFalha(new AxiosError('x', 'ECONNREFUSED'))).toMatchObject({ retriable: true });
    expect(classificarFalha(new AxiosError('x', 'ECONNABORTED')).motivo).toBe('timeout');
  });

  it('backoff exponencial com jitter limitado', () => {
    expect(calcularBackoffMs(1, () => 0)).toBe(100);
    expect(calcularBackoffMs(1, () => 1)).toBe(200);
    expect(calcularBackoffMs(3, () => 1)).toBe(800);
    expect(calcularBackoffMs(10, () => 1)).toBe(2000);
  });
});
