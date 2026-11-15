import { ConflictException, NotFoundException } from '@nestjs/common';
import type { CacheService } from '@kumoko/cache';
import type { Repository } from 'typeorm';
import type { CatalogSettings } from '../../../config/catalog-settings';
import type { FileStorageService } from '../../../shared/storage/file-storage.service';
import type { Obra } from '../../obras/entities/obra.entity';
import type { Pagina } from '../../paginas/entities/pagina.entity';
import type { Capitulo } from '../entities/capitulo.entity';
import { CapitulosService } from './capitulos.service';

const dup = Object.assign(new Error('Duplicate entry'), { code: 'ER_DUP_ENTRY' });

function setup() {
  const capitulos = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(async (c: Partial<Capitulo>) => ({
      ...c,
      id: c.id ?? 9,
      criadoEm: c.criadoEm ?? new Date(),
    })),
    create: jest.fn((c: Partial<Capitulo>) => c),
    delete: jest.fn(),
  };
  const obras = { existsBy: jest.fn().mockResolvedValue(true) };
  const qb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([{ capituloId: '1', total: '4' }]),
  };
  const paginas = { createQueryBuilder: jest.fn(() => qb) };
  const cache = {
    getOrSet: jest.fn(async (_k: string, _t: number, loader: () => Promise<unknown>) => ({
      value: await loader(),
      hit: false,
    })),
    invalidate: jest.fn().mockResolvedValue(1),
  };
  const storage = { removeDir: jest.fn() };
  const service = new CapitulosService(
    capitulos as unknown as Repository<Capitulo>,
    obras as unknown as Repository<Obra>,
    paginas as unknown as Repository<Pagina>,
    cache as unknown as CacheService,
    storage as unknown as FileStorageService,
    { cacheTtlSeconds: 60 } as CatalogSettings,
  );
  return { service, capitulos, obras, cache, storage };
}

describe('CapitulosService', () => {
  it('lista com totalPaginas via COUNT na chave catalog:obras:capitulos:<obraId>', async () => {
    const { service, capitulos, cache } = setup();
    capitulos.find.mockResolvedValue([
      { id: 1, obraId: 2, numero: '1.50', titulo: null, criadoEm: new Date() },
      { id: 2, obraId: 2, numero: 2, titulo: 'B', criadoEm: new Date() },
    ]);
    const { value } = await service.listByObra(2);
    expect(cache.getOrSet).toHaveBeenCalledWith('catalog:obras:capitulos:2', 60, expect.any(Function));
    expect(value.map((c) => [c.numero, c.totalPaginas])).toEqual([
      [1.5, 4],
      [2, 0],
    ]);
  });

  it('404 quando a obra nao existe', async () => {
    const { service, obras } = setup();
    obras.existsBy.mockResolvedValue(false);
    await expect(service.create(1, { numero: 1 })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('409 em numero duplicado (ER_DUP_ENTRY)', async () => {
    const { service, capitulos } = setup();
    capitulos.save.mockRejectedValueOnce(dup);
    await expect(service.create(1, { numero: 1 })).rejects.toBeInstanceOf(ConflictException);
  });

  it('create invalida a lista de capitulos da obra', async () => {
    const { service, cache } = setup();
    const res = await service.create(3, { numero: 10.5, titulo: null });
    expect(res).toMatchObject({ obraId: 3, numero: 10.5, titulo: null, totalPaginas: 0 });
    expect(cache.invalidate).toHaveBeenCalledWith('catalog:obras:capitulos:3');
  });

  it('remove apaga a pasta do capitulo e invalida capitulos e paginas', async () => {
    const { service, capitulos, storage, cache } = setup();
    capitulos.findOneBy.mockResolvedValue({ id: 4, obraId: 3 });
    await service.remove(4);
    expect(storage.removeDir).toHaveBeenCalledWith('pages/obra_3/capitulo_4');
    expect(cache.invalidate).toHaveBeenCalledWith('catalog:obras:capitulos:3');
    expect(cache.invalidate).toHaveBeenCalledWith('catalog:capitulos:paginas:4');
  });
});
