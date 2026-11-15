import { decimalTransformer } from '@kumoko/common';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TipoObra } from '../domain/tipo-obra';

/** Tabela `obras` (persistencia). Regras de negocio ficam em domain/obra-rules.ts. */
@Entity({ name: 'obras' })
@Index('idx_obras_tipo', ['tipo'])
@Index('idx_obras_nome', ['nome'])
export class Obra {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'enum', enum: TipoObra })
  tipo: TipoObra;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  autor: string | null;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ type: 'int', nullable: true })
  volume: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalTransformer })
  preco: number;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 5.0, transformer: decimalTransformer })
  avaliacao: number;

  @Column({ name: 'capa_path', type: 'varchar', length: 512, nullable: true })
  capaPath: string | null;

  /** Variante WebP 360px (cards). NULL ate ser gerada (upload, seed ou backfill). */
  @Column({ name: 'capa_thumb_path', type: 'varchar', length: 512, nullable: true })
  capaThumbPath: string | null;

  /** Variante WebP 720px (detalhe/admin). */
  @Column({ name: 'capa_media_path', type: 'varchar', length: 512, nullable: true })
  capaMediaPath: string | null;

  @Column({ name: 'total_vendido', type: 'int', default: 0 })
  totalVendido: number;

  @CreateDateColumn({ name: 'criado_em', type: 'datetime', precision: 3 })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'datetime', precision: 3 })
  atualizadoEm: Date;
}
