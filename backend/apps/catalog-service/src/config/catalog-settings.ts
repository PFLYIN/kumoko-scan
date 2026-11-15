import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'node:path';

/** Configuracoes especificas do catalogo, lidas uma vez do ConfigService (ja validadas pelo Joi). */
@Injectable()
export class CatalogSettings {
  readonly cacheTtlSeconds: number;
  readonly uploadsDir: string;
  readonly seedEnabled: boolean;
  readonly seedCoversDir: string;

  constructor(config: ConfigService) {
    this.cacheTtlSeconds = Number(config.get<number>('CACHE_TTL_SECONDS') ?? 60);
    // Caminhos relativos sao resolvidos a partir do diretorio de execucao (cwd).
    this.uploadsDir = resolve(config.get<string>('UPLOADS_DIR') ?? '/app/uploads');
    this.seedEnabled = String(config.get<boolean | string>('SEED_CATALOG') ?? 'true') === 'true';
    this.seedCoversDir = resolve(config.get<string>('SEED_COVERS_DIR') ?? '/app/seed/covers');
  }
}
