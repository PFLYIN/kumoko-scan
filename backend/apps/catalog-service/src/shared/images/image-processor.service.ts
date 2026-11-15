import { Injectable, Logger } from '@nestjs/common';
import { mkdir } from 'node:fs/promises';
import { dirname, posix } from 'node:path';
import sharp from 'sharp';
import { FileStorageService } from '../storage/file-storage.service';
import { toPosixRelative } from '../storage/public-url';

// Sem cache de arquivos do libvips: evita manter handles abertos (EBUSY ao apagar no Windows)
// e memoria retida; cada variante e gerada uma unica vez.
sharp.cache(false);

/** Especificacao de uma variante WebP derivada do original. */
export interface ImageVariantSpec {
  /** Sufixo do arquivo: `<base>.<sufixo>.webp`. */
  readonly sufixo: string;
  /** Largura maxima em px (nunca faz upscaling). */
  readonly largura: number;
  readonly qualidade: number;
}

export const IMAGE_VARIANTS = {
  /** Cards/grids do catalogo (ate 6 por linha em 1920px => ~300px de card; 360 cobre com folga). */
  capaThumb: { sufixo: 'thumb', largura: 360, qualidade: 80 },
  /** Pagina de detalhe e preview dos forms de admin. */
  capaMedia: { sufixo: 'medium', largura: 720, qualidade: 80 },
  /** Leitor de capitulos. */
  paginaLeitura: { sufixo: 'reader', largura: 1200, qualidade: 80 },
} as const satisfies Record<string, ImageVariantSpec>;

export interface VariantesCapa {
  thumbPath: string | null;
  mediaPath: string | null;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** `covers/a.jpg` + spec thumb -> `covers/a.thumb.webp`. */
export function variantPath(sourceRelative: string, spec: ImageVariantSpec): string {
  const rel = toPosixRelative(sourceRelative);
  const ext = posix.extname(rel);
  const base = ext ? rel.slice(0, -ext.length) : rel;
  return `${base}.${spec.sufixo}.webp`;
}

/**
 * Gera variantes WebP otimizadas a partir de imagens ja salvas em UPLOADS_DIR.
 * Aplica a orientacao EXIF (rotate), redimensiona sem ampliar e descarta metadados
 * (o sharp nao copia EXIF/ICC/XMP para a saida, a menos que `withMetadata` seja usado).
 */
@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  constructor(private readonly storage: FileStorageService) {}

  /** Gera uma variante; lanca se o original nao existir ou nao for imagem valida. */
  async gerarVariante(sourceRelative: string, spec: ImageVariantSpec): Promise<string> {
    const origem = this.storage.resolveInside(sourceRelative);
    const destinoRel = variantPath(sourceRelative, spec);
    const destino = this.storage.resolveInside(destinoRel);
    if (!origem || !destino) {
      throw new Error(`Caminho fora de UPLOADS_DIR: ${sourceRelative}`);
    }
    await mkdir(dirname(destino), { recursive: true });
    const info = await sharp(origem, { failOn: 'error' })
      .rotate()
      .resize({ width: spec.largura, withoutEnlargement: true })
      .webp({ quality: spec.qualidade, effort: 4 })
      .toFile(destino);
    this.logger.log(
      `Variante gerada path=${destinoRel} largura=${info.width} altura=${info.height} bytes=${info.size}`,
    );
    return destinoRel;
  }

  /** Thumb (360) e media (720) da capa. Best-effort: falha vira warn e o campo fica null. */
  async gerarVariantesCapa(capaPath: string): Promise<VariantesCapa> {
    const thumbPath = await this.tentar(capaPath, IMAGE_VARIANTS.capaThumb);
    const mediaPath = await this.tentar(capaPath, IMAGE_VARIANTS.capaMedia);
    return { thumbPath, mediaPath };
  }

  /** Versao de leitura (max 1200) da pagina. Best-effort: null em caso de falha. */
  async gerarVersaoLeitura(imagemPath: string): Promise<string | null> {
    return this.tentar(imagemPath, IMAGE_VARIANTS.paginaLeitura);
  }

  private async tentar(sourceRelative: string, spec: ImageVariantSpec): Promise<string | null> {
    try {
      return await this.gerarVariante(sourceRelative, spec);
    } catch (error) {
      this.logger.warn(
        `Falha ao gerar variante sufixo=${spec.sufixo} path=${sourceRelative} erro=${describeError(error)}`,
      );
      return null;
    }
  }
}
