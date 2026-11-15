import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheService, type CacheResult } from '@kumoko/cache';
import type { Repository } from 'typeorm';
import { CatalogSettings } from '../../../config/catalog-settings';
import { CatalogCacheKeys } from '../../../shared/cache/catalog-cache-keys';
import { isDuplicateEntryError } from '../../../shared/database/database-errors';
import { ImageProcessorService } from '../../../shared/images/image-processor.service';
import { FileStorageService } from '../../../shared/storage/file-storage.service';
import { StoragePaths } from '../../../shared/storage/storage-paths';
import { Capitulo } from '../../capitulos/entities/capitulo.entity';
import { CAPITULO_NAO_ENCONTRADO } from '../../capitulos/services/capitulos.service';
import type { CreatePaginaDto, PaginaResponseDto } from '../dto/pagina.dto';
import { Pagina } from '../entities/pagina.entity';
import { toPaginaResponse } from '../mappers/pagina.mapper';

export const PAGINA_NAO_ENCONTRADA = 'Página não encontrada.';
export const PAGINA_DUPLICADA = 'Já existe uma página com este número neste capítulo.';
export const IMAGEM_OBRIGATORIA = 'Envie a imagem da página no campo "imagem".';

@Injectable()
export class PaginasService {
  private readonly logger = new Logger(PaginasService.name);

  constructor(
    @InjectRepository(Pagina) private readonly paginas: Repository<Pagina>,
    @InjectRepository(Capitulo) private readonly capitulos: Repository<Capitulo>,
    private readonly cache: CacheService,
    private readonly storage: FileStorageService,
    private readonly settings: CatalogSettings,
    private readonly images: ImageProcessorService,
  ) {}

  async listByCapitulo(capituloId: number): Promise<CacheResult<PaginaResponseDto[]>> {
    return this.cache.getOrSet(
      CatalogCacheKeys.paginas(capituloId),
      this.settings.cacheTtlSeconds,
      async () => {
        await this.getCapitulo(capituloId);
        const lista = await this.paginas.find({ where: { capituloId }, order: { numero: 'ASC' } });
        return lista.map(toPaginaResponse);
      },
    );
  }

  async create(
    capituloId: number,
    dto: CreatePaginaDto,
    imagem?: Express.Multer.File,
  ): Promise<PaginaResponseDto> {
    if (!imagem?.buffer) {
      throw new BadRequestException(IMAGEM_OBRIGATORIA);
    }
    const capitulo = await this.getCapitulo(capituloId);
    const numero = dto.numero ?? (await this.proximoNumero(capituloId));
    if (await this.paginas.existsBy({ capituloId, numero })) {
      throw new ConflictException(PAGINA_DUPLICADA);
    }
    const imagemPath = await this.storage.saveImage(
      StoragePaths.capituloPagesDir(capitulo.obraId, capituloId),
      imagem.buffer,
    );
    const imagemOtimizadaPath = await this.images.gerarVersaoLeitura(imagemPath);
    let pagina: Pagina;
    try {
      pagina = await this.paginas.save(
        this.paginas.create({ capituloId, numero, imagemPath, imagemOtimizadaPath }),
      );
    } catch (error) {
      // Compensacao: os arquivos ja foram gravados, mas a linha nao.
      await this.storage.removeFile(imagemPath);
      await this.storage.removeFile(imagemOtimizadaPath);
      throw isDuplicateEntryError(error) ? new ConflictException(PAGINA_DUPLICADA) : error;
    }
    this.logger.log(`Pagina criada paginaId=${pagina.id} capituloId=${capituloId} numero=${numero}`);
    await this.invalidar(capitulo);
    return toPaginaResponse(pagina);
  }

  async remove(id: number): Promise<void> {
    const pagina = await this.paginas.findOneBy({ id });
    if (!pagina) {
      throw new NotFoundException(PAGINA_NAO_ENCONTRADA);
    }
    const capitulo = await this.capitulos.findOneBy({ id: pagina.capituloId });
    await this.paginas.delete({ id });
    await this.storage.removeFile(pagina.imagemPath);
    await this.storage.removeFile(pagina.imagemOtimizadaPath);
    this.logger.log(`Pagina excluida paginaId=${id} capituloId=${pagina.capituloId}`);
    if (capitulo) {
      await this.invalidar(capitulo);
    } else {
      await this.cache.invalidate(CatalogCacheKeys.paginas(pagina.capituloId));
    }
  }

  private async getCapitulo(id: number): Promise<Capitulo> {
    const capitulo = await this.capitulos.findOneBy({ id });
    if (!capitulo) {
      throw new NotFoundException(CAPITULO_NAO_ENCONTRADO);
    }
    return capitulo;
  }

  private async proximoNumero(capituloId: number): Promise<number> {
    const row = await this.paginas
      .createQueryBuilder('p')
      .select('MAX(p.numero)', 'max')
      .where('p.capitulo_id = :capituloId', { capituloId })
      .getRawOne<{ max: number | string | null }>();
    return Number(row?.max ?? 0) + 1;
  }

  /** Paginas mudam a lista de paginas e o totalPaginas da lista de capitulos da obra. */
  private async invalidar(capitulo: Capitulo): Promise<void> {
    const a = await this.cache.invalidate(CatalogCacheKeys.paginas(capitulo.id));
    const b = await this.cache.invalidate(CatalogCacheKeys.capitulos(capitulo.obraId));
    this.logger.log(
      `Cache de paginas invalidado capituloId=${capitulo.id} obraId=${capitulo.obraId} removidas=${a + b}`,
    );
  }
}
