import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { CacheService } from '@kumoko/cache';
import type { Repository } from 'typeorm';
import type { CatalogSettings } from '../../../config/catalog-settings';
import type { ImageProcessorService } from '../../../shared/images/image-processor.service';
import type { FileStorageService } from '../../../shared/storage/file-storage.service';
import { TipoObra } from '../domain/tipo-obra';
import type { Obra } from '../entities/obra.entity';
import type { ObraEventsPublisher } from '../events/obra-events.publisher';
import { escapeLike, ObrasService } from './obras.service';

function obraFake(over: Partial<Obra> = {}): Obra {
  return {
    id: 1,
    tipo: TipoObra.Manga,
    nome: 'Dandadan',
    autor: null,
    descricao: null,
    volume: 1,
    preco: 39.9,
    avaliacao: 5,
    capaPath: 'covers/antiga.jpg',
    capaThumbPath: 'covers/antiga.thumb.webp',
    capaMediaPath: 'covers/antiga.medium.webp',
    totalVendido: 0,
    criadoEm: new Date('2026-11-14T12:00:00Z'),
    atualizadoEm: new Date('2026-11-14T12:00:00Z'),
    ...over,
  };
}

function setup() {
  const repo = {
    query: jest.fn().mockResolvedValue([{ total: 0 }]),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    save: jest.fn(async (o: Obra) => ({ ...obraFake(), ...o, id: o.id ?? 10 })),
    create: jest.fn((o: Partial<Obra>) => ({ ...o }) as Obra),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: jest.fn(),
  };
  const store = new Map<string, unknown>();
  const cache = {
    getOrSet: jest.fn(async (key: string, _ttl: number, loader: () => Promise<unknown>) => {
      if (store.has(key)) {
        return { value: store.get(key), hit: true };
      }
      const value = await loader();
      store.set(key, value);
      return { value, hit: false };
    }),
    invalidatePrefix: jest.fn(async (prefix: string) => {
      let n = 0;
      for (const key of [...store.keys()]) {
        if (key.startsWith(prefix)) {
          store.delete(key);
          n++;
        }
      }
      return n;
    }),
  };
  const storage = {
    saveImage: jest.fn().mockResolvedValue('covers/nova.jpg'),
    removeFile: jest.fn().mockResolvedValue(true),
    removeDir: jest.fn().mockResolvedValue(true),
  };
  const events = { obraAtualizada: jest.fn(), obraExcluida: jest.fn() };
  const settings = { cacheTtlSeconds: 60 } as CatalogSettings;
  const images = {
    gerarVariantesCapa: jest.fn().mockResolvedValue({
      thumbPath: 'covers/nova.thumb.webp',
      mediaPath: 'covers/nova.medium.webp',
    }),
  };
  const service = new ObrasService(
    repo as unknown as Repository<Obra>,
    cache as unknown as CacheService,
    storage as unknown as FileStorageService,
    events as unknown as ObraEventsPublisher,
    settings,
    images as unknown as ImageProcessorService,
  );
  return { service, repo, cache, storage, events, store, images };
}

const arquivo = { buffer: Buffer.from('img') } as Express.Multer.File;

describe('ObrasService', () => {
  it('findById: MISS na primeira chamada, HIT na segunda, com a chave catalog:obras:id:<id>', async () => {
    const { service, repo, cache } = setup();
    repo.findOneBy.mockResolvedValue(obraFake());
    const primeira = await service.findById(1);
    const segunda = await service.findById(1);
    expect(primeira.hit).toBe(false);
    expect(segunda.hit).toBe(true);
    expect(repo.findOneBy).toHaveBeenCalledTimes(1);
    expect(cache.getOrSet).toHaveBeenCalledWith('catalog:obras:id:1', 60, expect.any(Function));
    expect(primeira.value).toMatchObject({ id: 1, preco: 39.9, capaUrl: '/files/covers/antiga.jpg' });
  });

  it('update: 409 ao mudar para livro uma obra que tem capitulos', async () => {
    const { service, repo } = setup();
    repo.findOneBy.mockResolvedValue(obraFake());
    repo.query.mockResolvedValue([{ total: '2' }]);
    await expect(service.update(1, { tipo: TipoObra.Livro })).rejects.toBeInstanceOf(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('findById: 404 quando nao existe', async () => {
    const { service, repo } = setup();
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.findById(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: invalida catalog:obras:, publica evento, substitui capa e apaga a antiga', async () => {
    const { service, repo, cache, storage, events, store } = setup();
    store.set('catalog:obras:id:1', {});
    store.set('catalog:obras:list:abc', {});
    store.set('catalog:capitulos:paginas:1', {});
    repo.findOneBy.mockResolvedValue(obraFake());

    const res = await service.update(1, { preco: 49.9, tipo: TipoObra.Livro }, arquivo);

    expect(res).toMatchObject({
      preco: 49.9,
      tipo: 'livro',
      volume: null,
      capaUrl: '/files/covers/nova.jpg',
      capaThumbUrl: '/files/covers/nova.thumb.webp',
      capaMediaUrl: '/files/covers/nova.medium.webp',
    });
    expect(cache.invalidatePrefix).toHaveBeenCalledWith('catalog:obras:');
    expect(store.has('catalog:obras:id:1')).toBe(false);
    expect(store.has('catalog:capitulos:paginas:1')).toBe(true);
    expect(events.obraAtualizada).toHaveBeenCalledWith(expect.objectContaining({ id: 1, preco: 49.9 }));
    expect(storage.removeFile).toHaveBeenCalledWith('covers/antiga.jpg');
    expect(storage.removeFile).toHaveBeenCalledWith('covers/antiga.thumb.webp');
    expect(storage.removeFile).toHaveBeenCalledWith('covers/antiga.medium.webp');
  });

  it('update: regra de dominio violada vira 400 sem gravar nada', async () => {
    const { service, repo, storage } = setup();
    repo.findOneBy.mockResolvedValue(obraFake());
    await expect(service.update(1, { preco: 10000 })).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
    expect(storage.saveImage).not.toHaveBeenCalled();
  });

  it('create: se o banco falhar apos salvar a capa, remove o arquivo (compensacao) e nao publica', async () => {
    const { service, repo, storage, events, cache } = setup();
    repo.save.mockRejectedValueOnce(new Error('db fora'));
    await expect(service.create({ tipo: TipoObra.Manga, nome: 'Nova', preco: 10 }, arquivo)).rejects.toThrow(
      'db fora',
    );
    expect(storage.removeFile).toHaveBeenCalledWith('covers/nova.jpg');
    expect(storage.removeFile).toHaveBeenCalledWith('covers/nova.thumb.webp');
    expect(storage.removeFile).toHaveBeenCalledWith('covers/nova.medium.webp');
    expect(events.obraAtualizada).not.toHaveBeenCalled();
    expect(cache.invalidatePrefix).not.toHaveBeenCalled();
  });

  it('create: avaliacao padrao 5, invalida cache e publica catalog.obra.updated', async () => {
    const { service, repo, events, cache } = setup();
    const res = await service.create({ tipo: TipoObra.Novel, nome: ' Re:Zero ', preco: 44.9, volume: 2 });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Re:Zero', avaliacao: 5, capaPath: null, volume: 2 }),
    );
    expect(res.capaUrl).toBeNull();
    expect(res.capaThumbUrl).toBeNull();
    expect(res.capaMediaUrl).toBeNull();
    expect(cache.invalidatePrefix).toHaveBeenCalledWith('catalog:obras:');
    expect(events.obraAtualizada).toHaveBeenCalled();
  });

  it('update: falha no banco remove a NOVA capa e mantem a antiga', async () => {
    const { service, repo, storage } = setup();
    repo.findOneBy.mockResolvedValue(obraFake());
    repo.save.mockRejectedValueOnce(new Error('db fora'));
    await expect(service.update(1, {}, arquivo)).rejects.toThrow('db fora');
    expect(storage.removeFile).toHaveBeenCalledTimes(3);
    expect(storage.removeFile).toHaveBeenCalledWith('covers/nova.jpg');
    expect(storage.removeFile).not.toHaveBeenCalledWith('covers/antiga.jpg');
  });

  it('remove: apaga linha, capa e pasta de paginas, invalida e publica catalog.obra.deleted', async () => {
    const { service, repo, storage, events, cache } = setup();
    repo.findOneBy.mockResolvedValue(obraFake({ id: 7 }));
    await service.remove(7);
    expect(repo.delete).toHaveBeenCalledWith({ id: 7 });
    expect(storage.removeFile).toHaveBeenCalledWith('covers/antiga.jpg');
    expect(storage.removeFile).toHaveBeenCalledWith('covers/antiga.thumb.webp');
    expect(storage.removeFile).toHaveBeenCalledWith('covers/antiga.medium.webp');
    expect(storage.removeDir).toHaveBeenCalledWith('pages/obra_7');
    expect(cache.invalidatePrefix).toHaveBeenCalledWith('catalog:obras:');
    expect(events.obraExcluida).toHaveBeenCalledWith({ id: 7, tipo: TipoObra.Manga });
  });

  it('findLote: valida ids (400) e retorna so existentes na ordem pedida', async () => {
    const { service, repo } = setup();
    await expect(service.findLote('1,x')).rejects.toBeInstanceOf(BadRequestException);
    repo.findBy.mockResolvedValue([obraFake({ id: 1 }), obraFake({ id: 2 })]);
    const res = await service.findLote('2,1,999');
    expect(res.map((o) => o.id)).toEqual([2, 1]);
  });

  it('escapeLike escapa curingas', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
  });
});
