import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Obra } from '../obras/entities/obra.entity';
import { Pagina } from '../paginas/entities/pagina.entity';
import { CapitulosController } from './controllers/capitulos.controller';
import { Capitulo } from './entities/capitulo.entity';
import { CapitulosService } from './services/capitulos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Capitulo, Obra, Pagina])],
  controllers: [CapitulosController],
  providers: [CapitulosService],
  exports: [CapitulosService],
})
export class CapitulosModule {}
