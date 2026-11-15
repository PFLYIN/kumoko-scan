import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheService } from '@kumoko/cache';
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import type { Repository } from 'typeorm';
import { CatalogSettings } from '../../../config/catalog-settings';
import { OBRAS_CACHE_PREFIX } from '../../../shared/cache/catalog-cache-keys';
import { ImageProcessorService } from '../../../shared/images/image-processor.service';
import { FileStorageService } from '../../../shared/storage/file-storage.service';
import { StoragePaths } from '../../../shared/storage/storage-paths';
import { normalizarObra } from '../domain/obra-rules';
import { Obra } from '../entities/obra.entity';
import { mangaSeed, OBRAS_SEM_CAPA } from './catalog-seed.data';

const EXTENSOES_CAPA = ['.jpg', '.jpeg', '.png', '.webp'];

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Popula o catalogo no boot quando SEED_CATALOG=true e a tabela obras esta vazia:
 * 1 manga por capa em SEED_COVERS_DIR (copiada para UPLOADS_DIR/covers) + 2 livros e 2 novels sem capa.
 */
@Injectable()
export class CatalogSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CatalogSeedService.name);

  constructor(
    @InjectRepository(Obra) private readonly obras: Repository<Obra>,
    private readonly storage: FileStorageService,
    private readonly settings: CatalogSettings,
    private readonly cache: CacheService,
    private readonly images: ImageProcessorService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.run();
    } catch (error) {
      // Seed nunca derruba o servico.
      this.logger.error(`Falha no seed do catalogo erro=${describeError(error)}`);
    }
  }

  /** Retorna quantas obras foram criadas (0 se desabilitado ou ja populado). */
  async run(): Promise<number> {
    if (!this.settings.seedEnabled) {
      this.logger.log('Seed do catalogo desabilitado (SEED_CATALOG=false)');
      return 0;
    }
    const existentes = await this.obras.count();
    if (existentes > 0) {
      this.logger.log(`Seed do catalogo ignorado: ja existem ${existentes} obras`);
      return 0;
    }

    const capas = await this.listarCapas();
    const copiadas: string[] = [];
    const novas: Obra[] = [];
    try {
      for (const [indice, arquivo] of capas.entries()) {
        const ext = extname(arquivo).toLowerCase().replace('.', '');
        const capaPath = await this.storage.importFile(
          join(this.settings.seedCoversDir, arquivo),
          StoragePaths.coversDir,
          ext,
        );
        copiadas.push(capaPath);
        const { thumbPath, mediaPath } = await this.images.gerarVariantesCapa(capaPath);
        copiadas.push(...[thumbPath, mediaPath].filter((p): p is string => Boolean(p)));
        novas.push(
          this.obras.create({
            ...normalizarObra(mangaSeed(arquivo, indice)),
            capaPath,
            capaThumbPath: thumbPath,
            capaMediaPath: mediaPath,
          }),
        );
      }
      for (const dados of OBRAS_SEM_CAPA) {
        novas.push(this.obras.create({ ...normalizarObra(dados), capaPath: null }));
      }
      await this.obras.save(novas);
    } catch (error) {
      // Compensacao: nao deixa capas orfas se o seed falhar no meio.
      for (const path of copiadas) {
        await this.storage.removeFile(path);
      }
      throw error;
    }
    // Listagens vazias podem ter sido cacheadas antes do seed terminar.
    await this.cache.invalidatePrefix(OBRAS_CACHE_PREFIX);
    this.logger.log(`Seed do catalogo concluido: ${novas.length} obras criadas (${capas.length} com capa)`);
    return novas.length;
  }

  private async listarCapas(): Promise<string[]> {
    const dir = this.settings.seedCoversDir;
    if (!existsSync(dir)) {
      this.logger.warn(`Pasta de capas do seed nao encontrada dir=${dir}; criando apenas obras sem capa`);
      return [];
    }
    const arquivos = await readdir(dir);
    return arquivos.filter((nome) => EXTENSOES_CAPA.includes(extname(nome).toLowerCase())).sort();
  }
}
