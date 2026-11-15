import { Global, Module } from '@nestjs/common';
import { CatalogSettings } from '../config/catalog-settings';
import { ImageProcessorService } from './images/image-processor.service';
import { FileStorageService } from './storage/file-storage.service';

/** Configuracoes do catalogo e armazenamento de arquivos, disponiveis para todos os modulos. */
@Global()
@Module({
  providers: [CatalogSettings, FileStorageService, ImageProcessorService],
  exports: [CatalogSettings, FileStorageService, ImageProcessorService],
})
export class CatalogCoreModule {}
