import type { CacheService } from '@kumoko/cache';
import { TipoObra } from '../domain/tipo-obra';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Repository } from 'typeorm';
import type { CatalogSettings } from '../../../config/catalog-settings';
import type { ImageProcessorService } from '../../../shared/images/image-processor.service';
import type { FileStorageService } from '../../../shared/storage/file-storage.service';
import type { Obra } from '../entities/obra.entity';
import { avaliacaoSeed, nomeDoArquivo, PRECO_SEED_MAX, PRECO_SEED_MIN, precoSeed } from './catalog-seed.data';
import { CatalogSeedService } from './catalog-seed.service';

describe('dados do seed', () => {
  it('preco deterministico entre 19.90 e 59.90 e avaliacao entre 4 e 5', () => {
    for (let i = 0; i < 100; i++) {
      expect(precoSeed(i)).toBeGreaterThanOrEqual(PRECO_SEED_MIN);
      expect(precoSeed(i)).toBeLessThanOrEqual(PRECO_SEED_MAX);
      expect(avaliacaoSeed(i)).toBeGreaterThanOrEqual(4);
      expect(avaliacaoSeed(i)).toBeLessThanOrEqual(5);
    }
    expect(precoSeed(3)).toBe(precoSeed(3));
  });

  it('nome vem do arquivo com _ trocado por espaco', () => {
    expect(nomeDoArquivo('Kage_no_Jitsuryokusha_ni_Naritakute!.jpg')).toBe(
      'Kage no Jitsuryokusha ni Naritakute!',
    );
  });
});

describe('CatalogSeedService', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'kumoko-seed-'));
    writeFileSync(join(dir, 'Blue_Ursus.jpg'), 'x');
    writeFileSync(join(dir, 'Dandadan.jpg'), 'x');
    writeFileSync(join(dir, 'leia-me.txt'), 'x');
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  function setup(over: Partial<CatalogSettings> = {}, count = 0) {
    const repo = {
      count: jest.fn().mockResolvedValue(count),
      create: jest.fn((o: Partial<Obra>) => o),
      save: jest.fn(async (lista: Obra[]) => lista),
    };
    const storage = {
      importFile: jest.fn(async (_src: string, _dir: string, ext: string) => `covers/safe.${ext}`),
      removeFile: jest.fn(),
    };
    const cache = { invalidatePrefix: jest.fn().mockResolvedValue(0) };
    const images = {
      gerarVariantesCapa: jest.fn(async (p: string) => ({
        thumbPath: p.replace('.jpg', '.thumb.webp'),
        mediaPath: p.replace('.jpg', '.medium.webp'),
      })),
    };
    const settings = { seedEnabled: true, seedCoversDir: dir, ...over } as CatalogSettings;
    const service = new CatalogSeedService(
      repo as unknown as Repository<Obra>,
      storage as unknown as FileStorageService,
      settings,
      cache as unknown as CacheService,
      images as unknown as ImageProcessorService,
    );
    return { service, repo, storage, cache };
  }

  it('cria 1 manga por capa + 2 livros + 2 novels', async () => {
    const { service, repo, storage, cache } = setup();
    await expect(service.run()).resolves.toBe(6);
    expect(cache.invalidatePrefix).toHaveBeenCalledTimes(1);
    expect(storage.importFile).toHaveBeenCalledTimes(2);
    const salvas = repo.save.mock.calls[0][0];
    expect(salvas[0]).toMatchObject({
      nome: 'Blue Ursus',
      tipo: 'manga',
      volume: 1,
      capaPath: 'covers/safe.jpg',
      capaThumbPath: 'covers/safe.thumb.webp',
      capaMediaPath: 'covers/safe.medium.webp',
    });
    expect(salvas.filter((o) => o.tipo === TipoObra.Livro)).toHaveLength(2);
    expect(salvas.filter((o) => o.tipo === TipoObra.Novel)).toHaveLength(2);
    expect(salvas.filter((o) => o.tipo === TipoObra.Livro).every((o) => o.volume === null)).toBe(true);
  });

  it('nao faz nada quando desabilitado ou com obras existentes', async () => {
    await expect(setup({ seedEnabled: false }).service.run()).resolves.toBe(0);
    const { service, repo } = setup({}, 3);
    await expect(service.run()).resolves.toBe(0);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('sem pasta de capas cria apenas as 4 obras sem capa', async () => {
    const { service, storage } = setup({ seedCoversDir: join(dir, 'nao-existe') });
    await expect(service.run()).resolves.toBe(4);
    expect(storage.importFile).not.toHaveBeenCalled();
  });

  it('remove capas copiadas se o save falhar', async () => {
    const { service, repo, storage } = setup();
    repo.save.mockRejectedValueOnce(new Error('falhou'));
    await expect(service.run()).rejects.toThrow('falhou');
    expect(storage.removeFile).toHaveBeenCalledTimes(6); // 2 capas + 2 variantes de cada
    // onApplicationBootstrap nunca lanca
    repo.save.mockRejectedValueOnce(new Error('falhou'));
    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
  });
});
