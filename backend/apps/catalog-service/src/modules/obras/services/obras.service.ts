import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheService, type CacheResult } from '@kumoko/cache';
import { paginate, toSkipTake, type Paginated } from '@kumoko/common';
import { In, type Repository } from 'typeorm';
import { CatalogSettings } from '../../../config/catalog-settings';
import { CatalogCacheKeys, OBRAS_CACHE_PREFIX } from '../../../shared/cache/catalog-cache-keys';
import { ImageProcessorService } from '../../../shared/images/image-processor.service';
import type { VariantesCapa } from '../../../shared/images/image-processor.service';
import { FileStorageService } from '../../../shared/storage/file-storage.service';
import { StoragePaths } from '../../../shared/storage/storage-paths';
import type { CreateObraDto } from '../dto/create-obra.dto';
import type { ListObrasQueryDto } from '../dto/list-obras-query.dto';
import type { ObraResponseDto } from '../dto/obra-response.dto';
import type { UpdateObraDto } from '../dto/update-obra.dto';
import { Obra } from '../entities/obra.entity';
import { ObraEventsPublisher } from '../events/obra-events.publisher';
import { toObraResponse } from '../mappers/obra.mapper';
import { ObraDomainError } from '../domain/obra-domain.error';
import { aplicarAlteracao, AVALIACAO_PADRAO, normalizarObra, type DadosObra } from '../domain/obra-rules';
import { OrdenacaoObras } from '../domain/ordenacao-obras';
import { parseLoteIds } from '../domain/lote-ids';

export const OBRA_NAO_ENCONTRADA = 'Obra não encontrada.';

/** Escapa curingas do LIKE (\, % e _) para buscar o texto literal. */
export function escapeLike(texto: string): string {
  return texto.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function dominio<T>(fn: () => T): T {
  try {
    return fn();
  } catch (error) {
    if (error instanceof ObraDomainError) {
      throw new BadRequestException(error.message);
    }
    throw error;
  }
}

/** Original + variantes da capa (para exclusao/substituicao). */
function arquivosDaCapa(obra: Obra): (string | null)[] {
  return [obra.capaPath, obra.capaThumbPath, obra.capaMediaPath];
}

function dadosDaObra(obra: Obra): DadosObra {
  return {
    tipo: obra.tipo,
    nome: obra.nome,
    autor: obra.autor,
    descricao: obra.descricao,
    volume: obra.volume,
    preco: Number(obra.preco),
    avaliacao: Number(obra.avaliacao),
  };
}

/** Casos de uso de obras: leitura com cache-aside, escrita com invalidacao + eventos e arquivos de capa. */
@Injectable()
export class ObrasService {
  private readonly logger = new Logger(ObrasService.name);

  constructor(
    @InjectRepository(Obra) private readonly obras: Repository<Obra>,
    private readonly cache: CacheService,
    private readonly storage: FileStorageService,
    private readonly events: ObraEventsPublisher,
    private readonly settings: CatalogSettings,
    private readonly images: ImageProcessorService,
  ) {}

  async list(query: ListObrasQueryDto): Promise<CacheResult<Paginated<ObraResponseDto>>> {
    const filtros = {
      tipo: query.tipo ?? null,
      busca: query.busca?.trim() || null,
      ordenar: query.ordenar ?? OrdenacaoObras.Recentes,
      page: query.page,
      limit: query.limit,
    };
    const key = CatalogCacheKeys.obrasList(filtros);
    return this.cache.getOrSet(key, this.settings.cacheTtlSeconds, async () => {
      const qb = this.obras.createQueryBuilder('o');
      if (filtros.tipo) {
        qb.andWhere('o.tipo = :tipo', { tipo: filtros.tipo });
      }
      if (filtros.busca) {
        qb.andWhere('(o.nome LIKE :busca OR o.autor LIKE :busca)', {
          busca: `%${escapeLike(filtros.busca)}%`,
        });
      }
      switch (filtros.ordenar) {
        case OrdenacaoObras.Nome:
          qb.orderBy('o.nome', 'ASC');
          break;
        case OrdenacaoObras.PrecoAsc:
          qb.orderBy('o.preco', 'ASC');
          break;
        case OrdenacaoObras.PrecoDesc:
          qb.orderBy('o.preco', 'DESC');
          break;
        case OrdenacaoObras.MaisVendidos:
          qb.orderBy('o.totalVendido', 'DESC');
          break;
        default:
          qb.orderBy('o.criadoEm', 'DESC');
      }
      qb.addOrderBy('o.id', filtros.ordenar === OrdenacaoObras.Recentes ? 'DESC' : 'ASC');
      const { skip, take } = toSkipTake({ page: filtros.page, limit: filtros.limit });
      const [rows, total] = await qb.skip(skip).take(take).getManyAndCount();
      return paginate(rows.map(toObraResponse), total, { page: filtros.page, limit: filtros.limit });
    });
  }

  async findById(id: number): Promise<CacheResult<ObraResponseDto>> {
    // Se a obra nao existe o loader lanca 404 e nada e cacheado.
    return this.cache.getOrSet(CatalogCacheKeys.obra(id), this.settings.cacheTtlSeconds, async () =>
      toObraResponse(await this.getEntity(id)),
    );
  }

  /** Lote para o order-service: retorna apenas as obras existentes, na ordem dos ids pedidos. */
  async findLote(rawIds: unknown): Promise<ObraResponseDto[]> {
    const ids = dominio(() => parseLoteIds(rawIds));
    const encontradas = await this.obras.findBy({ id: In(ids) });
    const porId = new Map(encontradas.map((obra) => [obra.id, obra]));
    const resultado = ids.flatMap((id) => {
      const obra = porId.get(id);
      return obra ? [toObraResponse(obra)] : [];
    });
    this.logger.log(`Lote de obras consultado pedidos=${ids.length} encontrados=${resultado.length}`);
    return resultado;
  }

  async getEntity(id: number): Promise<Obra> {
    const obra = await this.obras.findOneBy({ id });
    if (!obra) {
      throw new NotFoundException(OBRA_NAO_ENCONTRADA);
    }
    return obra;
  }

  async create(dto: CreateObraDto, capa?: Express.Multer.File): Promise<ObraResponseDto> {
    const dados = dominio(() =>
      normalizarObra({
        tipo: dto.tipo,
        nome: dto.nome,
        autor: dto.autor ?? null,
        descricao: dto.descricao ?? null,
        volume: dto.volume ?? null,
        preco: dto.preco,
        avaliacao: dto.avaliacao ?? AVALIACAO_PADRAO,
      }),
    );
    // Valida magic bytes e grava a capa ANTES do banco; se o banco falhar, remove o arquivo.
    const capaPath = capa ? await this.storage.saveImage(StoragePaths.coversDir, capa.buffer) : null;
    const variantes = await this.gerarVariantes(capaPath);
    let obra: Obra;
    try {
      obra = await this.obras.save(
        this.obras.create({
          ...dados,
          capaPath,
          capaThumbPath: variantes.thumbPath,
          capaMediaPath: variantes.mediaPath,
        }),
      );
    } catch (error) {
      await this.compensarArquivos([capaPath, variantes.thumbPath, variantes.mediaPath]);
      throw error;
    }
    this.logger.log(`Obra criada obraId=${obra.id} tipo=${obra.tipo} preco=${Number(obra.preco).toFixed(2)}`);
    await this.aposEscrita(obra);
    return toObraResponse(obra);
  }

  async update(id: number, dto: UpdateObraDto, capa?: Express.Multer.File): Promise<ObraResponseDto> {
    const obra = await this.getEntity(id);
    const dados = dominio(() =>
      aplicarAlteracao(dadosDaObra(obra), {
        tipo: dto.tipo,
        nome: dto.nome,
        autor: dto.autor,
        descricao: dto.descricao,
        volume: dto.volume,
        preco: dto.preco,
        avaliacao: dto.avaliacao,
      }),
    );
    const arquivosAntigos = arquivosDaCapa(obra);
    const novaCapa = capa ? await this.storage.saveImage(StoragePaths.coversDir, capa.buffer) : null;
    const variantes = await this.gerarVariantes(novaCapa);
    Object.assign(obra, dados);
    if (novaCapa) {
      obra.capaPath = novaCapa;
      obra.capaThumbPath = variantes.thumbPath;
      obra.capaMediaPath = variantes.mediaPath;
    }
    let salva: Obra;
    try {
      salva = await this.obras.save(obra);
    } catch (error) {
      await this.compensarArquivos([novaCapa, variantes.thumbPath, variantes.mediaPath]);
      throw error;
    }
    if (novaCapa) {
      // Substituicao: apaga a capa antiga e suas variantes.
      await this.removerArquivos(arquivosAntigos);
    }
    this.logger.log(
      `Obra atualizada obraId=${salva.id} tipo=${salva.tipo} preco=${Number(salva.preco).toFixed(2)}`,
    );
    await this.aposEscrita(salva);
    return toObraResponse(salva);
  }

  async remove(id: number): Promise<void> {
    const obra = await this.getEntity(id);
    // ON DELETE CASCADE remove capitulos e paginas no banco; os arquivos sao apagados em seguida.
    await this.obras.delete({ id });
    await this.removerArquivos(arquivosDaCapa(obra));
    await this.storage.removeDir(StoragePaths.obraPagesDir(id));
    this.logger.log(`Obra excluida obraId=${id}`);
    await this.invalidarObras();
    await this.events.obraExcluida({ id, tipo: obra.tipo });
  }

  /** Invalida todo o cache de obras (listagens, detalhes e capitulos). */
  async invalidarObras(): Promise<void> {
    const removidas = await this.cache.invalidatePrefix(OBRAS_CACHE_PREFIX);
    this.logger.log(`Cache de obras invalidado prefixo=${OBRAS_CACHE_PREFIX} removidas=${removidas}`);
  }

  private async aposEscrita(obra: Obra): Promise<void> {
    await this.invalidarObras();
    await this.events.obraAtualizada(obra);
  }

  private async gerarVariantes(capaPath: string | null): Promise<VariantesCapa> {
    return capaPath ? this.images.gerarVariantesCapa(capaPath) : { thumbPath: null, mediaPath: null };
  }

  private async removerArquivos(paths: (string | null)[]): Promise<void> {
    for (const path of paths) {
      if (path) {
        await this.storage.removeFile(path);
      }
    }
  }

  private async compensarArquivos(paths: (string | null)[]): Promise<void> {
    const enviados = paths.filter((path): path is string => Boolean(path));
    if (enviados.length > 0) {
      this.logger.warn(
        `Falha ao gravar obra no banco; removendo arquivos enviados paths=${enviados.join(',')}`,
      );
      await this.removerArquivos(enviados);
    }
  }
}
