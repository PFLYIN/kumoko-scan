import { decimalTransformer } from '@kumoko/common';
import { USER_ROLES, type UserRole } from '@kumoko/security';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Tabela `usuarios` (persistencia). Nunca exposta diretamente: use o mapper para UsuarioResponse. */
@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 120 })
  nome: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'char', length: 11, unique: true })
  cpf: string;

  @Column({ name: 'senha_hash', type: 'varchar', length: 255 })
  senhaHash: string;

  @Column({ type: 'enum', enum: USER_ROLES, default: 'customer' })
  role: UserRole;

  @Column({
    name: 'total_gasto',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  totalGasto: number;

  @CreateDateColumn({ name: 'criado_em', type: 'datetime', precision: 3 })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'datetime', precision: 3 })
  atualizadoEm: Date;
}
