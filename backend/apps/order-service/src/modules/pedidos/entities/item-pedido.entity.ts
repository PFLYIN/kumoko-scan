import { decimalTransformer } from '@kumoko/common';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { TIPOS_OBRA, type TipoObra } from '../domain/pedido.constants';
import { PedidoEntity } from './pedido.entity';

/** Persistencia dos itens do pedido (tabela `itens_pedido`), com snapshot da obra. */
@Entity({ name: 'itens_pedido' })
export class ItemPedidoEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'pedido_id', type: 'int', unsigned: true })
  pedidoId: number;

  @ManyToOne(() => PedidoEntity, (pedido) => pedido.itens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Relation<PedidoEntity>;

  @Column({ name: 'obra_id', type: 'int', unsigned: true })
  obraId: number;

  @Column({ name: 'nome_obra', type: 'varchar', length: 255 })
  nomeObra: string;

  @Column({ name: 'tipo_obra', type: 'enum', enum: TIPOS_OBRA })
  tipoObra: TipoObra;

  @Column({ name: 'capa_url', type: 'varchar', length: 512, nullable: true })
  capaUrl: string | null;

  @Column({
    name: 'preco_unitario',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  precoUnitario: number;

  @Column({ type: 'int', unsigned: true })
  quantidade: number;
}
