import { Dinheiro } from '../domain/dinheiro';
import { IdempotencyKey } from '../domain/idempotency-key';
import { ItemPedido } from '../domain/item-pedido';
import { ObraRef } from '../domain/obra-ref';
import { Pedido } from '../domain/pedido';
import { Quantidade } from '../domain/quantidade';
import { ItemPedidoEntity } from '../entities/item-pedido.entity';
import { PedidoEntity } from '../entities/pedido.entity';

/** Traducao entre o aggregate Pedido (dominio) e as entities TypeORM (persistencia). */
export const PedidoPersistenceMapper = {
  /** Dominio -> linha de `pedidos` (sem itens). */
  toPedidoEntity(pedido: Pedido): PedidoEntity {
    const entity = new PedidoEntity();
    if (pedido.id !== null) {
      entity.id = pedido.id;
    }
    entity.usuarioId = pedido.usuarioId;
    entity.status = pedido.status;
    entity.total = pedido.total.toNumber();
    entity.idempotencyKey = pedido.idempotencyKey?.valor ?? null;
    entity.criadoEm = pedido.criadoEm;
    return entity;
  },

  /** Dominio -> linhas de `itens_pedido` do pedido informado. */
  toItemEntities(pedido: Pedido, pedidoId: number): ItemPedidoEntity[] {
    return pedido.itens.map((item) => {
      const entity = new ItemPedidoEntity();
      entity.pedidoId = pedidoId;
      entity.obraId = item.obraId;
      entity.nomeObra = item.obra.nome;
      entity.tipoObra = item.obra.tipo;
      entity.capaUrl = item.obra.capaUrl;
      entity.precoUnitario = item.precoUnitario.toNumber();
      entity.quantidade = item.quantidade.valor;
      return entity;
    });
  },

  /** Persistencia -> aggregate reconstituido. */
  toDomain(entity: PedidoEntity, itens: ItemPedidoEntity[]): Pedido {
    return Pedido.reconstituir({
      id: entity.id,
      usuarioId: entity.usuarioId,
      status: entity.status,
      idempotencyKey: entity.idempotencyKey ? IdempotencyKey.criar(entity.idempotencyKey) : null,
      criadoEm: entity.criadoEm,
      itens: itens.map((item) =>
        ItemPedido.criar(
          ObraRef.criar({
            obraId: item.obraId,
            nome: item.nomeObra,
            tipo: item.tipoObra,
            capaUrl: item.capaUrl,
          }),
          Dinheiro.fromDecimal(item.precoUnitario),
          Quantidade.de(item.quantidade),
        ),
      ),
    });
  },
};
