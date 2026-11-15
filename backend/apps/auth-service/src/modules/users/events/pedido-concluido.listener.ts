import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { type EventEnvelope, EventBus, EventTypes, type OrderCompletedPayload } from '@kumoko/messaging';
import { DataSource } from 'typeorm';
import { isDuplicateEntryError } from '../../../shared/database-errors';
import { EventoProcessado } from '../entities/evento-processado.entity';
import { User } from '../entities/user.entity';

export type ResultadoProcessamento = 'processado' | 'duplicado' | 'usuario-inexistente';

/**
 * Consome `order.completed` e soma o total do pedido em `usuarios.total_gasto`.
 * Idempotente: o id do envelope e gravado em `eventos_processados` na mesma transacao do UPDATE.
 */
@Injectable()
export class PedidoConcluidoListener implements OnModuleInit {
  private readonly logger = new Logger(PedidoConcluidoListener.name);

  constructor(
    private readonly eventBus: EventBus,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  onModuleInit(): void {
    this.eventBus.subscribe<OrderCompletedPayload>(EventTypes.OrderCompleted, async (payload, envelope) => {
      await this.handle(payload, envelope);
    });
  }

  async handle(
    payload: OrderCompletedPayload | null | undefined,
    envelope: Pick<EventEnvelope, 'id' | 'type'>,
  ): Promise<ResultadoProcessamento> {
    const usuarioId = Number(payload?.usuarioId);
    const pedidoId = payload?.pedidoId;
    const total = Number(payload?.total);
    if (!Number.isInteger(usuarioId) || usuarioId <= 0 || !Number.isFinite(total) || total < 0) {
      // Lanca para o EventBus registrar "Falha ao processar evento".
      throw new Error(`Payload invalido em order.completed id=${envelope.id}`);
    }
    // Arredonda para centavos e formata com 2 casas para o UPDATE.
    const valor = (Math.round(total * 100) / 100).toFixed(2);

    return this.dataSource.transaction(async (manager): Promise<ResultadoProcessamento> => {
      try {
        await manager.insert(EventoProcessado, { eventId: envelope.id, tipo: envelope.type });
      } catch (error) {
        if (isDuplicateEntryError(error)) {
          this.logger.log(`Evento ignorado (ja processado) id=${envelope.id} pedidoId=${pedidoId}`);
          return 'duplicado';
        }
        throw error;
      }

      // UPDATE atomico (total_gasto = total_gasto + valor), sem ler e regravar.
      const result = await manager.increment(User, { id: usuarioId }, 'totalGasto', valor);
      if (!result.affected) {
        this.logger.warn(
          `Usuario inexistente ao registrar compra usuarioId=${usuarioId} pedidoId=${pedidoId} eventoId=${envelope.id}`,
        );
        return 'usuario-inexistente';
      }
      this.logger.log(
        `Total gasto atualizado usuarioId=${usuarioId} pedidoId=${pedidoId} acrescimo=${valor} eventoId=${envelope.id}`,
      );
      return 'processado';
    });
  }
}
