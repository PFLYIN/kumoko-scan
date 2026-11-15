import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheService } from '@kumoko/cache';
import { IsNull, Not, type Repository } from 'typeorm';
import { Obra } from '../../modules/obras/entities/obra.entity';
import { Pagina } from '../../modules/paginas/entities/pagina.entity';
import { OBRAS_CACHE_PREFIX } from '../cache/catalog-cache-keys';
import { IMAGE_VARIANTS, ImageProcessorService } from './image-processor.service';

/** Prefixo das listas de paginas em cache (`catalog:capitulos:paginas:<id>`). */
export const PAGINAS_CACHE_PREFIX = 'catalog:capitulos:paginas:';

export interface BackfillResultado {
  capas: number;
  paginas: number;
  falhas: number;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Gera, na subida, as variantes WebP de capas/paginas que ainda nao as tem (dados anteriores a
 * otimizacao). Idempotente: so processa linhas com caminho de variante NULL. Roda em segundo plano
 * e nunca derruba o boot; falhas por arquivo viram warn e a linha continua caindo para o original.
 */
@Injectable()
export class ImageBackfillService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ImageBackfillService.name);

  constructor(
    @InjectRepository(Obra) private readonly obras: Repository<Obra>,
    @InjectRepository(Pagina) private readonly paginas: Repository<Pagina>,
    private readonly images: ImageProcessorService,
    private readonly cache: CacheService,
  ) {}

  onApplicationBootstrap(): void {
    // Nao bloqueia o boot: o servico fica healthy enquanto as variantes sao geradas.
    void this.run().catch((error: unknown) =>
      this.logger.error(`Falha no backfill de imagens erro=${describeError(error)}`),
    );
  }

  async run(): Promise<BackfillResultado> {
    const resultado: BackfillResultado = { capas: 0, paginas: 0, falhas: 0 };

    const obras = await this.obras.find({
      where: [
        { capaPath: Not(IsNull()), capaThumbPath: IsNull() },
        { capaPath: Not(IsNull()), capaMediaPath: IsNull() },
      ],
    });
    for (const obra of obras) {
      const capa = obra.capaPath as string;
      try {
        const thumb = obra.capaThumbPath ?? (await this.images.gerarVariante(capa, IMAGE_VARIANTS.capaThumb));
        const media = obra.capaMediaPath ?? (await this.images.gerarVariante(capa, IMAGE_VARIANTS.capaMedia));
        await this.obras.update({ id: obra.id }, { capaThumbPath: thumb, capaMediaPath: media });
        resultado.capas++;
      } catch (error) {
        resultado.falhas++;
        this.logger.warn(
          `Backfill de capa falhou obraId=${obra.id} path=${capa} erro=${describeError(error)}`,
        );
      }
    }

    const paginas = await this.paginas.find({ where: { imagemOtimizadaPath: IsNull() } });
    for (const pagina of paginas) {
      try {
        const otimizada = await this.images.gerarVariante(pagina.imagemPath, IMAGE_VARIANTS.paginaLeitura);
        await this.paginas.update({ id: pagina.id }, { imagemOtimizadaPath: otimizada });
        resultado.paginas++;
      } catch (error) {
        resultado.falhas++;
        this.logger.warn(
          `Backfill de pagina falhou paginaId=${pagina.id} path=${pagina.imagemPath} erro=${describeError(error)}`,
        );
      }
    }

    if (resultado.capas > 0) {
      await this.cache.invalidatePrefix(OBRAS_CACHE_PREFIX);
    }
    if (resultado.paginas > 0) {
      await this.cache.invalidatePrefix(PAGINAS_CACHE_PREFIX);
    }
    this.logger.log(
      `Backfill de imagens concluido capas=${resultado.capas} paginas=${resultado.paginas} falhas=${resultado.falhas}`,
    );
    return resultado;
  }
}
