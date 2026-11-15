import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Capitulo } from '../../capitulos/entities/capitulo.entity';

/** Tabela `paginas`: imagem de uma pagina de capitulo (numero unico por capitulo). */
@Entity({ name: 'paginas' })
@Unique('uq_paginas_capitulo_numero', ['capituloId', 'numero'])
export class Pagina {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'capitulo_id', type: 'int' })
  capituloId: number;

  @ManyToOne(() => Capitulo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'capitulo_id', foreignKeyConstraintName: 'fk_paginas_capitulo' })
  capitulo?: Capitulo;

  @Column({ type: 'int' })
  numero: number;

  @Column({ name: 'imagem_path', type: 'varchar', length: 512 })
  imagemPath: string;

  @CreateDateColumn({ name: 'criado_em', type: 'datetime', precision: 3 })
  criadoEm: Date;
}
