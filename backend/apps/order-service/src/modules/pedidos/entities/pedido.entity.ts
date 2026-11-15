import { decimalTransformer } from '@kumoko/common';
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { STATUS_PEDIDO, type StatusPedido } from '../domain/pedido.constants';
import { ItemPedidoEntity } from './item-pedido.entity';

/** Persistencia da raiz do aggregate Pedido (tabela `pedidos`). */
@Entity({ name: 'pedidos' })
@Index('uq_pedidos_usuario_idempotency', ['usuarioId', 'idempotencyKey'], { unique: true })
@Index('idx_pedidos_usuario_criado', ['usuarioId', 'criadoEm'])
export class PedidoEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'usuario_id', type: 'int', unsigned: true })
  usuarioId: number;

  @Column({ type: 'enum', enum: STATUS_PEDIDO, default: 'CONCLUIDO' })
  status: StatusPedido;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: decimalTransformer })
  total: number;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 64, nullable: true })
  idempotencyKey: string | null;

  @Column({ name: 'criado_em', type: 'datetime', precision: 3 })
  criadoEm: Date;

  @OneToMany(() => ItemPedidoEntity, (item) => item.pedido, { cascade: ['insert'] })
  itens: ItemPedidoEntity[];
}
