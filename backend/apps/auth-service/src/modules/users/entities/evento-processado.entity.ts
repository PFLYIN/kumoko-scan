import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/** Registro de eventos ja consumidos (idempotencia: o id do envelope e a chave primaria). */
@Entity('eventos_processados')
export class EventoProcessado {
  @PrimaryColumn({ name: 'event_id', type: 'varchar', length: 36 })
  eventId: string;

  @Column({ type: 'varchar', length: 64 })
  tipo: string;

  @CreateDateColumn({ name: 'processado_em', type: 'datetime', precision: 3 })
  processadoEm: Date;
}
