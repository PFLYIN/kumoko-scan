import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import type { CatalogSettings } from '../../config/catalog-settings';
import { FileStorageService } from '../storage/file-storage.service';
import { IMAGE_VARIANTS, ImageProcessorService, variantPath } from './image-processor.service';

async function jpeg(width: number, height: number, orientation?: number): Promise<Buffer> {
  let img = sharp({ create: { width, height, channels: 3, background: '#c0392b' } }).jpeg();
  if (orientation) {
    img = img.withMetadata({ orientation });
  }
  return img.toBuffer();
}

describe('ImageProcessorService', () => {
  let root: string;
  let processor: ImageProcessorService;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'kumoko-img-'));
    mkdirSync(join(root, 'covers'));
    processor = new ImageProcessorService(new FileStorageService({ uploadsDir: root } as CatalogSettings));
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('nomeia variantes como <base>.<sufixo>.webp', () => {
    expect(variantPath('covers/a.jpg', IMAGE_VARIANTS.capaThumb)).toBe('covers/a.thumb.webp');
    expect(variantPath('pages\\o\\b.png', IMAGE_VARIANTS.paginaLeitura)).toBe('pages/o/b.reader.webp');
  });

  it('gera thumb 360 e media 720 em WebP', async () => {
    writeFileSync(join(root, 'covers/a.jpg'), await jpeg(1400, 2000));
    const { thumbPath, mediaPath } = await processor.gerarVariantesCapa('covers/a.jpg');
    expect(thumbPath).toBe('covers/a.thumb.webp');
    expect(mediaPath).toBe('covers/a.medium.webp');
    const thumb = await sharp(join(root, thumbPath!)).metadata();
    const media = await sharp(join(root, mediaPath!)).metadata();
    expect(thumb).toMatchObject({ format: 'webp', width: 360, height: 514 });
    expect(media).toMatchObject({ format: 'webp', width: 720 });
  });

  it('nao amplia imagens menores que a largura alvo', async () => {
    writeFileSync(join(root, 'covers/p.jpg'), await jpeg(200, 300));
    const { mediaPath } = await processor.gerarVariantesCapa('covers/p.jpg');
    expect((await sharp(join(root, mediaPath!)).metadata()).width).toBe(200);
  });

  it('respeita a orientacao EXIF e remove metadados', async () => {
    // orientation 6 = girar 90 graus: 400x200 armazenado vira 200x400 exibido.
    writeFileSync(join(root, 'covers/r.jpg'), await jpeg(400, 200, 6));
    const out = await processor.gerarVersaoLeitura('covers/r.jpg');
    const meta = await sharp(join(root, out!)).metadata();
    expect(meta).toMatchObject({ width: 200, height: 400 });
    expect(meta.exif).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
  });

  it('pagina usa largura maxima 1200', async () => {
    writeFileSync(join(root, 'covers/g.jpg'), await jpeg(2400, 3400));
    const out = await processor.gerarVersaoLeitura('covers/g.jpg');
    expect(out).toBe('covers/g.reader.webp');
    expect((await sharp(join(root, out!)).metadata()).width).toBe(1200);
  });

  it('falha vira null (original ausente, corrompido ou fora da raiz)', async () => {
    writeFileSync(join(root, 'covers/x.jpg'), 'nao e imagem');
    await expect(processor.gerarVariantesCapa('covers/nao-existe.jpg')).resolves.toEqual({
      thumbPath: null,
      mediaPath: null,
    });
    await expect(processor.gerarVersaoLeitura('covers/x.jpg')).resolves.toBeNull();
    await expect(processor.gerarVersaoLeitura('../fora.jpg')).resolves.toBeNull();
    expect(existsSync(join(root, 'covers/x.reader.webp'))).toBe(false);
  });
});
