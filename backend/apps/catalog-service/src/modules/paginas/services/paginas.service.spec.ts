import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { CacheService } from '@kumoko/cache';
import type { Repository } from 'typeorm';
import type { CatalogSettings } from '../../../config/catalog-settings';
import type { ImageProcessorService } from '../../../shared/images/image-processor.service';
import type { FileStorageService } from '../../../shared/storage/file-storage.service';
import type { Capitulo } from '../../capitulos/entities/capitulo.entity';
import type { Pagina } from '../entities/pagina.entity';
import { PaginasService } from './paginas.service';

const imagem = { buffer: Buffer.from('img') } as Express.Multer.File;

function setup() {
  const qb = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ max: '3' }),
  };
  const paginas = {
    existsBy: jest.fn().mockResolvedValue(false),
    save: jest.fn(async (p: Partial<Pagina>) => ({ ...p, id: p.id ?? 1 })),
    create: jest.fn((p: Partial<Pagina>) => p),
    findOneBy: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => qb),
    manager: { transaction: jest.fn() },
  };
  const tx = {
    find: jest.fn().mockResolvedValue([
      { id: 10, capituloId: 5, numero: 1, imagemPath: 'p/10.jpg', imagemOtimizadaPath: null },
      { id: 11, capituloId: 5, numero: 2, imagemPath: 'p/11.jpg', imagemOtimizadaPath: null },
      { id: 12, capituloId: 5, numero: 3, imagemPath: 'p/12.jpg', imagemOtimizadaPath: null },
    ]),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    updateQb: {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 3 }),
    },
  };
  paginas.manager.transaction.mockImplementation(async (fn: (em: unknown) => Promise<unknown>) =>
    fn({
      getRepository: () => ({
        find: tx.find,
        update: tx.update,
        createQueryBuilder: () => tx.updateQb,
      }),
    }),
  );
  const capitulos = { findOneBy: jest.fn().mockResolvedValue({ id: 5, obraId: 2 }) };
  const cache = { invalidate: jest.fn().mockResolvedValue(1) };
  const storage = {
    saveImage: jest.fn().mockResolvedValue('pages/obra_2/capitulo_5/a.jpg'),
    removeFile: jest.fn(),
  };
  const service = new PaginasService(
    paginas as unknown as Repository<Pagina>,
    capitulos as unknown as Repository<Capitulo>,
    cache as unknown as CacheService,
    storage as unknown as FileStorageService,
    { cacheTtlSeconds: 60 } as CatalogSettings,
    {
      gerarVersaoLeitura: jest.fn().mockResolvedValue('pages/obra_2/capitulo_5/a.reader.webp'),
    } as unknown as ImageProcessorService,
  );
  return { service, paginas, cache, storage, tx };
}

describe('PaginasService', () => {
  it('numero padrao = max + 1, grava na pasta do capitulo e invalida paginas e capitulos', async () => {
    const { service, storage, cache } = setup();
    const res = await service.create(5, {}, imagem);
    expect(res).toEqual({
      id: 1,
      capituloId: 5,
      numero: 4,
      imagemUrl: '/files/pages/obra_2/capitulo_5/a.jpg',
      imagemOtimizadaUrl: '/files/pages/obra_2/capitulo_5/a.reader.webp',
    });
    expect(storage.saveImage).toHaveBeenCalledWith('pages/obra_2/capitulo_5', imagem.buffer);
    expect(cache.invalidate).toHaveBeenCalledWith('catalog:capitulos:paginas:5');
    expect(cache.invalidate).toHaveBeenCalledWith('catalog:obras:capitulos:2');
  });

  it('400 sem imagem e 409 com numero ja usado', async () => {
    const { service, paginas } = setup();
    await expect(service.create(5, {})).rejects.toBeInstanceOf(BadRequestException);
    paginas.existsBy.mockResolvedValue(true);
    await expect(service.create(5, { numero: 1 }, imagem)).rejects.toBeInstanceOf(ConflictException);
  });

  it('compensa o arquivo se o insert falhar por corrida (ER_DUP_ENTRY -> 409)', async () => {
    const { service, paginas, storage } = setup();
    paginas.save.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
    await expect(service.create(5, { numero: 9 }, imagem)).rejects.toBeInstanceOf(ConflictException);
    expect(storage.removeFile).toHaveBeenCalledWith('pages/obra_2/capitulo_5/a.jpg');
    expect(storage.removeFile).toHaveBeenCalledWith('pages/obra_2/capitulo_5/a.reader.webp');
  });

  it('reordenar desloca (offset) e grava 1..N na ordem enviada, invalidando caches', async () => {
    const { service, tx, cache } = setup();
    const res = await service.reordenar(5, { paginaIds: [12, 10, 11] });
    expect(res.map((p) => [p.id, p.numero])).toEqual([
      [12, 1],
      [10, 2],
      [11, 3],
    ]);
    expect(tx.updateQb.execute).toHaveBeenCalledTimes(1);
    const ordemUpdates = tx.update.mock.calls.map((c) => [c[0].id, c[1].numero]);
    expect(ordemUpdates).toEqual([
      [12, 1],
      [10, 2],
      [11, 3],
    ]);
    // o deslocamento acontece antes da renumeracao
    expect(tx.updateQb.execute.mock.invocationCallOrder[0]).toBeLessThan(tx.update.mock.invocationCallOrder[0]);
    expect(cache.invalidate).toHaveBeenCalledWith('catalog:capitulos:paginas:5');
    expect(cache.invalidate).toHaveBeenCalledWith('catalog:obras:capitulos:2');
  });

  it('reordenar rejeita lista incompleta, com repeticao ou com id de outro capitulo (400)', async () => {
    const { service, tx, cache } = setup();
    await expect(service.reordenar(5, { paginaIds: [10, 11] })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.reordenar(5, { paginaIds: [10, 10, 11] })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.reordenar(5, { paginaIds: [10, 11, 99] })).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.update).not.toHaveBeenCalled();
    expect(cache.invalidate).not.toHaveBeenCalled();
  });

  it('reordenar retorna 404 para capitulo inexistente', async () => {
    const { service, paginas } = setup();
    (service as unknown as { capitulos: { findOneBy: jest.Mock } }).capitulos.findOneBy.mockResolvedValue(null);
    await expect(service.reordenar(99, { paginaIds: [1] })).rejects.toBeInstanceOf(NotFoundException);
    expect(paginas.manager.transaction).not.toHaveBeenCalled();
  });

  it('remove apaga o arquivo da pagina', async () => {
    const { service, paginas, storage } = setup();
    paginas.findOneBy.mockResolvedValue({
      id: 1,
      capituloId: 5,
      imagemPath: 'pages/x.jpg',
      imagemOtimizadaPath: 'pages/x.reader.webp',
    });
    await service.remove(1);
    expect(storage.removeFile).toHaveBeenCalledWith('pages/x.jpg');
    expect(storage.removeFile).toHaveBeenCalledWith('pages/x.reader.webp');
  });
});
