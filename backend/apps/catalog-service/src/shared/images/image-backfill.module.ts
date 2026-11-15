import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Obra } from '../../modules/obras/entities/obra.entity';
import { Pagina } from '../../modules/paginas/entities/pagina.entity';
import { ImageBackfillService } from './image-backfill.service';

/** Backfill das variantes WebP no boot (ImageProcessorService vem do CatalogCoreModule global). */
@Module({
  imports: [TypeOrmModule.forFeature([Obra, Pagina])],
  providers: [ImageBackfillService],
})
export class ImageBackfillModule {}
