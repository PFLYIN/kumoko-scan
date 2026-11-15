import { BadRequestException } from '@nestjs/common';
import { createImageUploadOptions } from './image-upload.options';
import { assertImageMagicBytes, detectImageType } from './image-magic-bytes';
import { generateSafeFileName } from './safe-file-name';

const pad = (bytes: number[]) => Buffer.concat([Buffer.from(bytes), Buffer.alloc(16)]);

const JPG = pad([0xff, 0xd8, 0xff, 0xe0]);
const PNG = pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x24, 0, 0, 0]),
  Buffer.from('WEBPVP8 '),
  Buffer.alloc(8),
]);

describe('assertImageMagicBytes', () => {
  it('detecta JPG, PNG e WEBP pelos primeiros bytes', () => {
    expect(assertImageMagicBytes(JPG)).toEqual({ ext: 'jpg', mime: 'image/jpeg' });
    expect(assertImageMagicBytes(PNG)).toEqual({ ext: 'png', mime: 'image/png' });
    expect(assertImageMagicBytes(WEBP)).toEqual({ ext: 'webp', mime: 'image/webp' });
  });

  it('rejeita conteudo que nao e imagem mesmo com extensao de imagem', () => {
    const script = Buffer.from('<?php echo "x"; ?> conteudo malicioso');
    expect(() => assertImageMagicBytes(script)).toThrow(BadRequestException);
  });

  it('rejeita GIF, buffer vazio e ausente', () => {
    expect(detectImageType(pad([0x47, 0x49, 0x46, 0x38]))).toBeNull();
    expect(() => assertImageMagicBytes(Buffer.alloc(0))).toThrow(BadRequestException);
    expect(() => assertImageMagicBytes(undefined)).toThrow(BadRequestException);
  });
});

describe('generateSafeFileName', () => {
  it('gera nome unico com timestamp + uuid e normaliza jpeg', () => {
    const a = generateSafeFileName('.JPEG');
    const b = generateSafeFileName('jpg');
    expect(a).toMatch(/^\d+-[0-9a-f-]{36}\.jpg$/);
    expect(a).not.toEqual(b);
  });

  it('recusa extensao com caracteres perigosos', () => {
    expect(() => generateSafeFileName('../../etc')).toThrow();
    expect(() => generateSafeFileName('php;.jpg')).toThrow();
  });
});

describe('createImageUploadOptions', () => {
  const options = createImageUploadOptions({ maxSizeMb: 5 });

  const runFilter = (originalname: string, mimetype: string) =>
    new Promise<{ error: Error | null; accepted: boolean }>((resolve) => {
      const filter = options.fileFilter as unknown as (
        req: unknown,
        file: { originalname: string; mimetype: string },
        cb: (error: Error | null, accepted: boolean) => void,
      ) => void;
      filter({}, { originalname, mimetype }, (error, accepted) => resolve({ error, accepted }));
    });

  it('limita o tamanho em bytes', () => {
    expect((options.limits as { fileSize?: number }).fileSize).toBe(5 * 1024 * 1024);
  });

  it('aceita mimetype e extensao permitidos', async () => {
    await expect(runFilter('capa.webp', 'image/webp')).resolves.toEqual({ error: null, accepted: true });
  });

  it('recusa extensao ou mimetype fora da lista', async () => {
    const svg = await runFilter('capa.svg', 'image/svg+xml');
    expect(svg.accepted).toBe(false);
    expect(svg.error).toBeInstanceOf(BadRequestException);
    const disguised = await runFilter('capa.exe', 'image/png');
    expect(disguised.accepted).toBe(false);
  });
});
