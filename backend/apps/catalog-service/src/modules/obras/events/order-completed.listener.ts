import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { CacheService } from '@kumoko/cache';
import { type EventEnvelope, EventBus, EventTypes, type OrderCompletedPayload } from '@kumoko/messaging';
import type { DataSource } from 'typeorm';
import { OBRAS_CACHE_PREFIX } from '../../../shared/cache/catalog-cache-keys';
import { isDuplicateEntryError } from '../../../shared/database/database-errors';
import { EventoProcessado } from '../entities/evento-processado.entity';
import { Obra } from '../entities/obra.entity';

/** Soma as quantidades por obra, descartando itens malformados. */
export function somarQuantidadesPorObra(payload: OrderCompletedPayload): Map<number, number> {
  const totais = new Map<number, number>();
  for (const item of payload?.itens ?? []) {
    const obraId = Number(item?.obraId);
    const quantidade = Number(item?.quantidade);
    if (!Number.isInteger(obraId) || obraId < 1 || !Number.isInteger(quantidade) || quantidade < 1) {
      continue;
    }
    totais.set(obraId, (totais.get(obraId) ?? 0) + quantidade);
  }
  return totais;
}

/**
 * order.completed -> incrementa obras.total_vendido. Idempotente: o envelope.id e gravado em
 * eventos_processados na MESMA transacao dos UPDATEs; reentrega gera ER_DUP_ENTRY e e ignorada.
 */
@Injectable()
export class OrderCompletedListener implements OnModuleInit {
  private readonly logger = new Logger(OrderCompletedListener.name);

  constructor(
    private readonly eventBus: EventBus,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly cache: CacheService,
  ) {}

  onModuleInit(): void {
    this.eventBus.subscribe<OrderCompletedPayload>(EventTypes.OrderCompleted, async (payload, envelope) => {
      await this.handle(payload, envelope);
    });
  }

  /** Retorna true se aplicou o evento, false se ja havia sido processado. */
  async handle(
    payload: OrderCompletedPayload,
    envelope: EventEnvelope<OrderCompletedPayload>,
  ): Promise<boolean> {
    const totais = somarQuantidadesPorObra(payload);
    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.insert(EventoProcessado, { eventId: envelope.id, tipo: envelope.type });
        for (const [obraId, quantidade] of totais) {
          await manager.increment(Obra, { id: obraId }, 'totalVendido', quantidade);
        }
      });
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        this.logger.log(
          `Evento ja processado; ignorado eventId=${envelope.id} pedidoId=${payload?.pedidoId}`,
        );
        return false;
      }
      throw error;
    }
    const itens = [...totais].map(([obraId, qtd]) => `${obraId}x${qtd}`).join(',');
    this.logger.log(
      `Vendas registradas pedidoId=${payload?.pedidoId} eventId=${envelope.id} obras=${totais.size} itens=${itens}`,
    );
    const removidas = await this.cache.invalidatePrefix(OBRAS_CACHE_PREFIX);
    this.logger.log(
      `Cache de obras invalidado apos venda prefixo=${OBRAS_CACHE_PREFIX} removidas=${removidas}`,
    );
    return true;
  }
}
