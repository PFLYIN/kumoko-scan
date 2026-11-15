import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObrasController } from './controllers/obras.controller';
import { EventoProcessado } from './entities/evento-processado.entity';
import { Obra } from './entities/obra.entity';
import { ObraEventsPublisher } from './events/obra-events.publisher';
import { OrderCompletedListener } from './events/order-completed.listener';
import { CatalogSeedService } from './seed/catalog-seed.service';
import { ObrasService } from './services/obras.service';

@Module({
  imports: [TypeOrmModule.forFeature([Obra, EventoProcessado])],
  controllers: [ObrasController],
  providers: [ObrasService, ObraEventsPublisher, OrderCompletedListener, CatalogSeedService],
  exports: [ObrasService, TypeOrmModule],
})
export class ObrasModule {}
