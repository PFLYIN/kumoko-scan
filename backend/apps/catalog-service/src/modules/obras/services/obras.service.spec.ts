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
    generos: ['Ação', 'Fantasia'],
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
    find: jest.fn().mockResolvedValue([]),
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

  it('create/update: normaliza generos (dedup, caixa) e PATCH sem generos mantem a lista', async () => {
    const { service, repo } = setup();
    await service.create({ tipo: TipoObra.Manga, nome: 'X', preco: 10, generos: ['acao', 'Ação', 'isekai'] });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ generos: ['Acao', 'Isekai'] }));
    await expect(
      service.create({ tipo: TipoObra.Manga, nome: 'X', preco: 10, generos: ['<b>'] }),
    ).rejects.toBeInstanceOf(BadRequestException);

    repo.findOneBy.mockResolvedValue(obraFake());
    const mantida = await service.update(1, { nome: 'Novo' });
    expect(mantida.generos).toEqual(['Ação', 'Fantasia']);
    repo.findOneBy.mockResolvedValue(obraFake());
    const limpa = await service.update(1, { generos: [] });
    expect(limpa.generos).toEqual([]);
  });

  it('list: filtro por genero usa LIKE no JSON e entra na chave de cache', async () => {
    const { service, repo } = setup();
    const qb = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[obraFake()], 1]),
    };
    repo.createQueryBuilder.mockReturnValue(qb);
    const a = await service.list({ page: 1, limit: 10, genero: ' fantasia ' });
    expect(qb.andWhere).toHaveBeenCalledWith('o.generos LIKE :genero', { genero: '%"Fantasia"%' });
    expect(a.hit).toBe(false);
    expect((await service.list({ page: 1, limit: 10, genero: 'Fantasia' })).hit).toBe(true);
    expect((await service.list({ page: 1, limit: 10 })).hit).toBe(false);
  });

  it('listarGeneros: conta obras por genero com cache catalog:obras:generos', async () => {
    const { service, repo, cache } = setup();
    repo.find.mockResolvedValue([{ generos: ['Ação', 'Drama'] }, { generos: ['acao'] }, { generos: null }]);
    const r1 = await service.listarGeneros();
    expect(r1).toEqual({
      hit: false,
      value: [
        { genero: 'Ação', total: 2 },
        { genero: 'Drama', total: 1 },
      ],
    });
    expect((await service.listarGeneros()).hit).toBe(true);
    expect(cache.getOrSet).toHaveBeenCalledWith('catalog:obras:generos', 60, expect.any(Function));
  });

  it('findRelacionadas: rankeia por genero/tipo, 404 se a obra nao existe e e invalidada com o prefixo', async () => {
    const { service, repo, cache } = setup();
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.findRelacionadas(99, 6)).rejects.toBeInstanceOf(NotFoundException);

    repo.findOneBy.mockResolvedValue(obraFake({ id: 1 }));
    repo.find.mockResolvedValue([
      obraFake({ id: 1 }),
      obraFake({ id: 2, tipo: TipoObra.Livro, generos: ['Drama'] }),
      obraFake({ id: 3, tipo: TipoObra.Novel, generos: ['Fantasia'] }),
      obraFake({ id: 4, generos: [] }),
    ]);
    const res = await service.findRelacionadas(1, 6);
    expect(res.hit).toBe(false);
    expect(res.value.map((o) => o.id)).toEqual([3, 4]);
    expect((await service.findRelacionadas(1, 6)).hit).toBe(true);
    await service.invalidarObras();
    expect(cache.invalidatePrefix).toHaveBeenCalledWith('catalog:obras:');
    expect((await service.findRelacionadas(1, 6)).hit).toBe(false);
  });

  it('escapeLike escapa curingas', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
  });
});
