import { Global, Module } from '@nestjs/common';
import { CatalogSettings } from '../config/catalog-settings';
import { FileStorageService } from './storage/file-storage.service';

/** Configuracoes do catalogo e armazenamento de arquivos, disponiveis para todos os modulos. */
@Global()
@Module({
  providers: [CatalogSettings, FileStorageService],
  exports: [CatalogSettings, FileStorageService],
})
export class CatalogCoreModule {}
