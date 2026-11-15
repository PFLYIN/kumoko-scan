import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { REDIS_CLIENT, REDIS_SUBSCRIBER } from '@kumoko/cache';
import { getRequestId, runWithRequestContext } from '@kumoko/observability';
import type { Redis } from 'ioredis';
import { randomUUID } from 'node:crypto';
import { type EventEnvelope, isEventEnvelope } from './contracts/event-envelope';
import { channelForEvent, type EventType } from './contracts/event-types';
import { MESSAGING_OPTIONS, type MessagingOptions } from './messaging.constants';

export type EventHandler<T> = (payload: T, envelope: EventEnvelope<T>) => Promise<void> | void;

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Barramento de eventos sobre Redis Pub/Sub (entrega at-most-once, sem persistencia).
 * - publish: usa REDIS_CLIENT; nunca lanca (falha e logada) para nao desfazer a operacao de negocio.
 * - subscribe: usa REDIS_SUBSCRIBER; erro no handler e logado e nao derruba o subscriber.
 */
@Injectable()
export class EventBus implements OnModuleDestroy {
  private readonly logger = new Logger(EventBus.name);
  private readonly handlers = new Map<string, Array<EventHandler<unknown>>>();
  private readonly onMessage = (channel: string, message: string): void => {
    void this.handleMessage(channel, message);
  };

  constructor(
    @Inject(REDIS_CLIENT) private readonly publisher: Redis,
    @Inject(REDIS_SUBSCRIBER) private readonly subscriber: Redis,
    @Inject(MESSAGING_OPTIONS) private readonly options: MessagingOptions,
  ) {
    this.subscriber.on('message', this.onMessage);
  }

  async publish<T>(type: EventType, payload: T): Promise<EventEnvelope<T>> {
    const id = randomUUID();
    const envelope: EventEnvelope<T> = {
      id,
      type,
      source: this.options.serviceName,
      occurredAt: new Date().toISOString(),
      correlationId: getRequestId() ?? id,
      payload,
    };
    const channel = channelForEvent(type);
    try {
      const receivers = await this.publisher.publish(channel, JSON.stringify(envelope));
      this.logger.log(
        `Evento publicado type=${type} id=${id} channel=${channel} source=${envelope.source} receptores=${receivers}`,
      );
    } catch (error) {
      this.logger.error(
        `Falha ao publicar evento type=${type} id=${id} channel=${channel} erro=${describeError(error)}`,
      );
    }
    return envelope;
  }

  /**
   * Registra um handler para o tipo de evento (chamar no onModuleInit dos listeners).
   * Nao bloqueia o boot: o SUBSCRIBE e enviado quando a conexao estiver pronta.
   */
  subscribe<T>(type: EventType, handler: EventHandler<T>): void {
    const channel = channelForEvent(type);
    const list = this.handlers.get(channel) ?? [];
    list.push(handler as EventHandler<unknown>);
    this.handlers.set(channel, list);
    if (list.length > 1) {
      return;
    }
    this.subscriber
      .subscribe(channel)
      .then(() => this.logger.log(`Inscrito no canal channel=${channel}`))
      .catch((error: unknown) =>
        this.logger.error(`Falha ao assinar canal channel=${channel} erro=${describeError(error)}`),
      );
  }

  /** Processa uma mensagem recebida. Publico para testes; nunca lanca. */
  async handleMessage(channel: string, message: string): Promise<void> {
    const handlers = this.handlers.get(channel);
    if (!handlers || handlers.length === 0) {
      return;
    }
    let envelope: unknown;
    try {
      envelope = JSON.parse(message);
    } catch {
      this.logger.warn(`Mensagem invalida ignorada channel=${channel}`);
      return;
    }
    if (!isEventEnvelope(envelope)) {
      this.logger.warn(`Envelope invalido ignorado channel=${channel}`);
      return;
    }
    const event = envelope;
    const correlationId = event.correlationId || event.id;
    this.logger.log(
      `Evento recebido type=${event.type} id=${event.id} source=${event.source} correlationId=${correlationId}`,
    );

    // Executa os handlers no contexto de correlacao do evento (logs e chamadas HTTP propagam o id).
    await runWithRequestContext({ requestId: correlationId }, async () => {
      for (const handler of handlers) {
        try {
          await handler(event.payload, event);
          this.logger.log(`Evento processado type=${event.type} id=${event.id}`);
        } catch (error) {
          this.logger.error(
            `Falha ao processar evento type=${event.type} id=${event.id} erro=${describeError(error)}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }
    });
  }

  onModuleDestroy(): void {
    this.subscriber.off('message', this.onMessage);
  }
}
