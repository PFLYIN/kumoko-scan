import { Inject, Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client';
import { OBSERVABILITY_OPTIONS, type ObservabilityOptions } from '../observability.constants';

export type HttpMetricLabels = 'method' | 'route' | 'status_code' | 'service';
export type CacheOperationResult = 'hit' | 'miss' | 'invalidate';
export type EventConsumeOutcome = 'processed' | 'failed' | 'duplicate';
export type CircuitBreakerState = 'CLOSED' | 'HALF_OPEN' | 'OPEN';

/** Valor numerico do gauge circuit_breaker_state (0 fechado, 1 meio-aberto, 2 aberto). */
export const CIRCUIT_BREAKER_STATE_VALUE: Record<CircuitBreakerState, number> = {
  CLOSED: 0,
  HALF_OPEN: 1,
  OPEN: 2,
};

/**
 * Registro Prometheus do servico: metricas padrao do Node, latencia HTTP,
 * cache-aside, eventos (Pub/Sub) e estado de circuit breakers.
 */
@Injectable()
export class MetricsService {
  readonly registry = new Registry();
  readonly httpRequestDuration: Histogram<HttpMetricLabels>;
  readonly cacheOperations: Counter<'service' | 'result'>;
  readonly eventsPublished: Counter<'service' | 'type'>;
  readonly eventsConsumed: Counter<'service' | 'type' | 'outcome'>;
  readonly circuitBreakerState: Gauge<'service' | 'target'>;
  private readonly serviceName: string;

  constructor(@Inject(OBSERVABILITY_OPTIONS) options: ObservabilityOptions) {
    this.serviceName = options.serviceName;
    collectDefaultMetrics({ register: this.registry, labels: { service: this.serviceName } });
    this.httpRequestDuration = new Histogram<HttpMetricLabels>({
      name: 'http_request_duration_seconds',
      help: 'Duracao das requisicoes HTTP em segundos',
      labelNames: ['method', 'route', 'status_code', 'service'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });
    this.cacheOperations = new Counter({
      name: 'cache_operations_total',
      help: 'Operacoes de cache-aside por resultado (hit, miss, invalidate)',
      labelNames: ['service', 'result'],
      registers: [this.registry],
    });
    this.eventsPublished = new Counter({
      name: 'events_published_total',
      help: 'Eventos de dominio publicados no Redis Pub/Sub',
      labelNames: ['service', 'type'],
      registers: [this.registry],
    });
    this.eventsConsumed = new Counter({
      name: 'events_consumed_total',
      help: 'Eventos de dominio consumidos por resultado (processed, failed, duplicate)',
      labelNames: ['service', 'type', 'outcome'],
      registers: [this.registry],
    });
    this.circuitBreakerState = new Gauge({
      name: 'circuit_breaker_state',
      help: 'Estado do circuit breaker por dependencia (0 closed, 1 half-open, 2 open)',
      labelNames: ['service', 'target'],
      registers: [this.registry],
    });
  }

  /** Inicia o cronometro; a funcao retornada registra a observacao com os labels finais. */
  startHttpTimer(): (labels: { method: string; route: string; status_code: string }) => void {
    const end = this.httpRequestDuration.startTimer();
    return (labels) => {
      end({ ...labels, service: this.serviceName });
    };
  }

  recordCacheOperation(result: CacheOperationResult, count = 1): void {
    this.cacheOperations.inc({ service: this.serviceName, result }, count);
  }

  recordEventPublished(type: string): void {
    this.eventsPublished.inc({ service: this.serviceName, type });
  }

  recordEventConsumed(type: string, outcome: EventConsumeOutcome): void {
    this.eventsConsumed.inc({ service: this.serviceName, type, outcome });
  }

  setCircuitBreakerState(target: string, state: CircuitBreakerState): void {
    this.circuitBreakerState.set({ service: this.serviceName, target }, CIRCUIT_BREAKER_STATE_VALUE[state]);
  }

  get contentType(): string {
    return this.registry.contentType;
  }

  metrics(): Promise<string> {
    return this.registry.metrics();
  }
}
