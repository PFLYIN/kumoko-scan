import type { CacheService } from '@kumoko/cache';
import type { Repository } from 'typeorm';
import type { Obra } from '../../modules/obras/entities/obra.entity';
import type { Pagina } from '../../modules/paginas/entities/pagina.entity';
import { ImageBackfillService, PAGINAS_CACHE_PREFIX } from './image-backfill.service';
import type { ImageProcessorService, ImageVariantSpec } from './image-processor.service';

function setup(obras: Partial<Obra>[], paginas: Partial<Pagina>[], falharEm?: string) {
  const obrasRepo = { find: jest.fn().mockResolvedValue(obras), update: jest.fn() };
  const paginasRepo = { find: jest.fn().mockResolvedValue(paginas), update: jest.fn() };
  const images = {
    gerarVariante: jest.fn(async (src: string, spec: ImageVariantSpec) => {
      if (src === falharEm) {
        throw new Error('arquivo ausente');
      }
      return `${src}.${spec.sufixo}.webp`;
    }),
  };
  const cache = { invalidatePrefix: jest.fn().mockResolvedValue(1) };
  const service = new ImageBackfillService(
    obrasRepo as unknown as Repository<Obra>,
    paginasRepo as unknown as Repository<Pagina>,
    images as unknown as ImageProcessorService,
    cache as unknown as CacheService,
  );
  return { service, obrasRepo, paginasRepo, images, cache };
}

describe('ImageBackfillService', () => {
  it('gera somente as variantes ausentes e invalida o cache', async () => {
    const { service, obrasRepo, paginasRepo, images, cache } = setup(
      [
        { id: 1, capaPath: 'covers/a.jpg', capaThumbPath: null, capaMediaPath: null },
        { id: 2, capaPath: 'covers/b.jpg', capaThumbPath: 'covers/b.thumb.webp', capaMediaPath: null },
      ],
      [{ id: 9, imagemPath: 'pages/p.jpg', imagemOtimizadaPath: null }],
    );
    await expect(service.run()).resolves.toEqual({ capas: 2, paginas: 1, falhas: 0 });
    expect(images.gerarVariante).toHaveBeenCalledTimes(4);
    expect(obrasRepo.update).toHaveBeenCalledWith(
      { id: 2 },
      { capaThumbPath: 'covers/b.thumb.webp', capaMediaPath: 'covers/b.jpg.medium.webp' },
    );
    expect(paginasRepo.update).toHaveBeenCalledWith(
      { id: 9 },
      { imagemOtimizadaPath: 'pages/p.jpg.reader.webp' },
    );
    expect(cache.invalidatePrefix).toHaveBeenCalledWith('catalog:obras:');
    expect(cache.invalidatePrefix).toHaveBeenCalledWith(PAGINAS_CACHE_PREFIX);
  });

  it('idempotente: nada pendente nao gera nem invalida', async () => {
    const { service, images, cache } = setup([], []);
    await expect(service.run()).resolves.toEqual({ capas: 0, paginas: 0, falhas: 0 });
    expect(images.gerarVariante).not.toHaveBeenCalled();
    expect(cache.invalidatePrefix).not.toHaveBeenCalled();
  });

  it('falha em um arquivo nao interrompe os demais', async () => {
    const { service, obrasRepo } = setup(
      [
        { id: 1, capaPath: 'covers/sumiu.jpg', capaThumbPath: null, capaMediaPath: null },
        { id: 2, capaPath: 'covers/ok.jpg', capaThumbPath: null, capaMediaPath: null },
      ],
      [],
      'covers/sumiu.jpg',
    );
    await expect(service.run()).resolves.toEqual({ capas: 1, paginas: 0, falhas: 1 });
    expect(obrasRepo.update).toHaveBeenCalledTimes(1);
  });

  it('erro geral no boot e capturado (nao derruba o servico)', async () => {
    const { service, obrasRepo } = setup([], []);
    obrasRepo.find.mockRejectedValue(new Error('db fora'));
    expect(() => service.onApplicationBootstrap()).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));
  });
});
