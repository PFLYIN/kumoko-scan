import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheService, type CacheResult } from '@kumoko/cache';
import { In, type Repository } from 'typeorm';
import { CatalogSettings } from '../../../config/catalog-settings';
import { CatalogCacheKeys } from '../../../shared/cache/catalog-cache-keys';
import { isDuplicateEntryError } from '../../../shared/database/database-errors';
import { FileStorageService } from '../../../shared/storage/file-storage.service';
import { StoragePaths } from '../../../shared/storage/storage-paths';
import { OBRA_NAO_ENCONTRADA } from '../../obras/services/obras.service';
import { Obra } from '../../obras/entities/obra.entity';
import { Pagina } from '../../paginas/entities/pagina.entity';
import type { CapituloResponseDto, CreateCapituloDto, UpdateCapituloDto } from '../dto/capitulo.dto';
import { Capitulo } from '../entities/capitulo.entity';
import { toCapituloResponse } from '../mappers/capitulo.mapper';

export const CAPITULO_NAO_ENCONTRADO = 'Capítulo não encontrado.';
export const CAPITULO_DUPLICADO = 'Já existe um capítulo com este número nesta obra.';

@Injectable()
export class CapitulosService {
  private readonly logger = new Logger(CapitulosService.name);

  constructor(
    @InjectRepository(Capitulo) private readonly capitulos: Repository<Capitulo>,
    @InjectRepository(Obra) private readonly obras: Repository<Obra>,
    @InjectRepository(Pagina) private readonly paginas: Repository<Pagina>,
    private readonly cache: CacheService,
    private readonly storage: FileStorageService,
    private readonly settings: CatalogSettings,
  ) {}

  async listByObra(obraId: number): Promise<CacheResult<CapituloResponseDto[]>> {
    return this.cache.getOrSet(
      CatalogCacheKeys.capitulos(obraId),
      this.settings.cacheTtlSeconds,
      async () => {
        await this.assertObraExiste(obraId);
        const lista = await this.capitulos.find({ where: { obraId }, order: { numero: 'ASC' } });
        const totais = await this.contarPaginas(lista.map((c) => c.id));
        return lista.map((c) => toCapituloResponse(c, totais.get(c.id) ?? 0));
      },
    );
  }

  async create(obraId: number, dto: CreateCapituloDto): Promise<CapituloResponseDto> {
    await this.assertObraExiste(obraId);
    let capitulo: Capitulo;
    try {
      capitulo = await this.capitulos.save(
        this.capitulos.create({ obraId, numero: dto.numero, titulo: dto.titulo ?? null }),
      );
    } catch (error) {
      throw this.traduzirErro(error);
    }
    this.logger.log(`Capitulo criado capituloId=${capitulo.id} obraId=${obraId} numero=${capitulo.numero}`);
    await this.invalidarCapitulos(obraId);
    return toCapituloResponse(capitulo, 0);
  }

  async update(id: number, dto: UpdateCapituloDto): Promise<CapituloResponseDto> {
    const capitulo = await this.getEntity(id);
    if (dto.numero !== undefined) {
      capitulo.numero = dto.numero;
    }
    if (dto.titulo !== undefined) {
      capitulo.titulo = dto.titulo;
    }
    let salvo: Capitulo;
    try {
      salvo = await this.capitulos.save(capitulo);
    } catch (error) {
      throw this.traduzirErro(error);
    }
    this.logger.log(`Capitulo atualizado capituloId=${id} obraId=${salvo.obraId} numero=${salvo.numero}`);
    await this.invalidarCapitulos(salvo.obraId);
    const totais = await this.contarPaginas([id]);
    return toCapituloResponse(salvo, totais.get(id) ?? 0);
  }

  async remove(id: number): Promise<void> {
    const capitulo = await this.getEntity(id);
    // ON DELETE CASCADE remove as paginas no banco; a pasta de imagens e apagada em seguida.
    await this.capitulos.delete({ id });
    await this.storage.removeDir(StoragePaths.capituloPagesDir(capitulo.obraId, id));
    this.logger.log(`Capitulo excluido capituloId=${id} obraId=${capitulo.obraId}`);
    await this.invalidarCapitulos(capitulo.obraId);
    await this.cache.invalidate(CatalogCacheKeys.paginas(id));
  }

  async getEntity(id: number): Promise<Capitulo> {
    const capitulo = await this.capitulos.findOneBy({ id });
    if (!capitulo) {
      throw new NotFoundException(CAPITULO_NAO_ENCONTRADO);
    }
    return capitulo;
  }

  async invalidarCapitulos(obraId: number): Promise<void> {
    const removidas = await this.cache.invalidate(CatalogCacheKeys.capitulos(obraId));
    this.logger.log(`Cache de capitulos invalidado obraId=${obraId} removidas=${removidas}`);
  }

  private async assertObraExiste(obraId: number): Promise<void> {
    const existe = await this.obras.existsBy({ id: obraId });
    if (!existe) {
      throw new NotFoundException(OBRA_NAO_ENCONTRADA);
    }
  }

  /** COUNT de paginas por capitulo em uma unica consulta. */
  private async contarPaginas(capituloIds: number[]): Promise<Map<number, number>> {
    if (capituloIds.length === 0) {
      return new Map();
    }
    const rows = await this.paginas
      .createQueryBuilder('p')
      .select('p.capitulo_id', 'capituloId')
      .addSelect('COUNT(*)', 'total')
      .where({ capituloId: In(capituloIds) })
      .groupBy('p.capitulo_id')
      .getRawMany<{ capituloId: number | string; total: number | string }>();
    return new Map(rows.map((row) => [Number(row.capituloId), Number(row.total)]));
  }

  private traduzirErro(error: unknown): unknown {
    return isDuplicateEntryError(error) ? new ConflictException(CAPITULO_DUPLICADO) : error;
  }
}
