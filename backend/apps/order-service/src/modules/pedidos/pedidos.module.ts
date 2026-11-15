import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { PedidosAdminController } from './controllers/pedidos-admin.controller';
import { PedidosController } from './controllers/pedidos.controller';
import { PEDIDO_REPOSITORY } from './domain/pedido.repository';
import { ItemPedidoEntity } from './entities/item-pedido.entity';
import { PedidoEntity } from './entities/pedido.entity';
import { PedidoEventsPublisher } from './events/pedido.publisher';
import { TypeOrmPedidoRepository } from './repositories/typeorm-pedido.repository';
import { PedidosAdminService } from './services/pedidos-admin.service';
import { PedidosService } from './services/pedidos.service';

/** Contexto de Vendas: aggregate Pedido, persistencia e API /api/pedidos (+ visao admin). */
@Module({
  imports: [TypeOrmModule.forFeature([PedidoEntity, ItemPedidoEntity]), CatalogoModule],
  // Admin primeiro: GET /pedidos/admin precisa casar antes de GET /pedidos/:id.
  controllers: [PedidosAdminController, PedidosController],
  providers: [
    PedidosService,
    PedidosAdminService,
    PedidoEventsPublisher,
    { provide: PEDIDO_REPOSITORY, useClass: TypeOrmPedidoRepository },
  ],
})
export class PedidosModule {}
