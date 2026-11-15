import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { PedidosController } from './controllers/pedidos.controller';
import { PEDIDO_REPOSITORY } from './domain/pedido.repository';
import { ItemPedidoEntity } from './entities/item-pedido.entity';
import { PedidoEntity } from './entities/pedido.entity';
import { PedidoEventsPublisher } from './events/pedido.publisher';
import { TypeOrmPedidoRepository } from './repositories/typeorm-pedido.repository';
import { PedidosService } from './services/pedidos.service';

/** Contexto de Vendas: aggregate Pedido, persistencia e API /api/pedidos. */
@Module({
  imports: [TypeOrmModule.forFeature([PedidoEntity, ItemPedidoEntity]), CatalogoModule],
  controllers: [PedidosController],
  providers: [
    PedidosService,
    PedidoEventsPublisher,
    { provide: PEDIDO_REPOSITORY, useClass: TypeOrmPedidoRepository },
  ],
})
export class PedidosModule {}
