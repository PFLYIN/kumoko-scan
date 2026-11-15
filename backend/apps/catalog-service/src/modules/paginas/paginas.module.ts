import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Capitulo } from '../capitulos/entities/capitulo.entity';
import { PaginasController } from './controllers/paginas.controller';
import { Pagina } from './entities/pagina.entity';
import { PaginasService } from './services/paginas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pagina, Capitulo])],
  controllers: [PaginasController],
  providers: [PaginasService],
})
export class PaginasModule {}
