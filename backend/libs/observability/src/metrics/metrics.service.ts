import { Inject, Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Histogram, Registry } from 'prom-client';
import { OBSERVABILITY_OPTIONS, type ObservabilityOptions } from '../observability.constants';

export type HttpMetricLabels = 'method' | 'route' | 'status_code' | 'service';

/** Registro Prometheus do servico (metricas padrao do Node + latencia HTTP). */
@Injectable()
export class MetricsService {
  readonly registry = new Registry();
  readonly httpRequestDuration: Histogram<HttpMetricLabels>;
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
  }

  /** Inicia o cronometro; a funcao retornada registra a observacao com os labels finais. */
  startHttpTimer(): (labels: { method: string; route: string; status_code: string }) => void {
    const end = this.httpRequestDuration.startTimer();
    return (labels) => {
      end({ ...labels, service: this.serviceName });
    };
  }

  get contentType(): string {
    return this.registry.contentType;
  }

  metrics(): Promise<string> {
    return this.registry.metrics();
  }
}
