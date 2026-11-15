import { ItemPedidoEntity } from '../modules/pedidos/entities/item-pedido.entity';
import { PedidoEntity } from '../modules/pedidos/entities/pedido.entity';

/** Entities persistidas pelo order-service. */
export const ORDER_ENTITIES = [PedidoEntity, ItemPedidoEntity];
