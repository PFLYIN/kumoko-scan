import { decimalTransformer } from '@kumoko/common';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Obra } from '../../obras/entities/obra.entity';

/** Tabela `capitulos`: numero decimal (ex.: 10.5) unico por obra. */
@Entity({ name: 'capitulos' })
@Unique('uq_capitulos_obra_numero', ['obraId', 'numero'])
export class Capitulo {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'obra_id', type: 'int' })
  obraId: number;

  @ManyToOne(() => Obra, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obra_id', foreignKeyConstraintName: 'fk_capitulos_obra' })
  obra?: Obra;

  @Column({ type: 'decimal', precision: 6, scale: 2, transformer: decimalTransformer })
  numero: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  titulo: string | null;

  @CreateDateColumn({ name: 'criado_em', type: 'datetime', precision: 3 })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'datetime', precision: 3 })
  atualizadoEm: Date;
}
