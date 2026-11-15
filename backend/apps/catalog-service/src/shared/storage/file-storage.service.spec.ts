import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CatalogSettings } from '../../config/catalog-settings';
import { FileStorageService } from './file-storage.service';
import { toPosixRelative, toPublicFileUrl } from './public-url';

const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

describe('FileStorageService', () => {
  let root: string;
  let storage: FileStorageService;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'kumoko-up-'));
    storage = new FileStorageService({ uploadsDir: root } as CatalogSettings);
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('salva imagem valida com nome seguro e remove depois', async () => {
    const rel = await storage.saveImage('covers', JPG);
    expect(rel).toMatch(/^covers\/\d+-[0-9a-f-]+\.jpg$/);
    expect(existsSync(join(root, rel))).toBe(true);
    await expect(storage.removeFile(rel)).resolves.toBe(true);
    expect(existsSync(join(root, rel))).toBe(false);
  });

  it('rejeita conteudo que nao e imagem (magic bytes)', async () => {
    await expect(
      storage.saveImage('covers', Buffer.from('nao sou imagem, sou texto')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recusa caminhos fora de UPLOADS_DIR', async () => {
    expect(storage.resolveInside('../fora.jpg')).toBeNull();
    expect(storage.resolveInside('')).toBeNull();
    await expect(storage.removeFile('../../etc/passwd')).resolves.toBe(false);
    await expect(storage.removeDir('..')).resolves.toBe(false);
  });

  it('urls publicas usam /files/ e barras normais', () => {
    expect(toPosixRelative('pages\\obra_1\\a.jpg')).toBe('pages/obra_1/a.jpg');
    expect(toPublicFileUrl('covers/a.jpg')).toBe('/files/covers/a.jpg');
    expect(toPublicFileUrl(null)).toBeNull();
  });
});
