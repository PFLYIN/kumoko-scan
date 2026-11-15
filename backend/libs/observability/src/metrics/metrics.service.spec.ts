import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let metrics: MetricsService;

  beforeEach(() => {
    metrics = new MetricsService({ serviceName: 'test-service' });
  });

  it('expoe as metricas padrao e o histograma HTTP', async () => {
    metrics.startHttpTimer()({ method: 'GET', route: '/api/obras', status_code: '200' });
    const text = await metrics.metrics();
    expect(text).toContain('process_cpu_user_seconds_total');
    expect(text).toMatch(
      /http_request_duration_seconds_count\{[^}]*route="\/api\/obras"[^}]*service="test-service"/,
    );
  });

  it('conta operacoes de cache por resultado', async () => {
    metrics.recordCacheOperation('hit');
    metrics.recordCacheOperation('hit');
    metrics.recordCacheOperation('miss');
    metrics.recordCacheOperation('invalidate', 3);
    const text = await metrics.metrics();
    expect(text).toContain('cache_operations_total{service="test-service",result="hit"} 2');
    expect(text).toContain('cache_operations_total{service="test-service",result="miss"} 1');
    expect(text).toContain('cache_operations_total{service="test-service",result="invalidate"} 3');
  });

  it('conta eventos publicados e consumidos por tipo e resultado', async () => {
    metrics.recordEventPublished('order.completed');
    metrics.recordEventConsumed('order.completed', 'processed');
    metrics.recordEventConsumed('order.completed', 'duplicate');
    metrics.recordEventConsumed('order.completed', 'failed');
    const text = await metrics.metrics();
    expect(text).toContain('events_published_total{service="test-service",type="order.completed"} 1');
    for (const outcome of ['processed', 'duplicate', 'failed']) {
      expect(text).toContain(
        `events_consumed_total{service="test-service",type="order.completed",outcome="${outcome}"} 1`,
      );
    }
  });

  it('mapeia o estado do circuit breaker para 0/1/2', async () => {
    metrics.setCircuitBreakerState('catalog-service', 'OPEN');
    expect(await metrics.metrics()).toContain(
      'circuit_breaker_state{service="test-service",target="catalog-service"} 2',
    );
    metrics.setCircuitBreakerState('catalog-service', 'HALF_OPEN');
    expect(await metrics.metrics()).toContain(
      'circuit_breaker_state{service="test-service",target="catalog-service"} 1',
    );
    metrics.setCircuitBreakerState('catalog-service', 'CLOSED');
    expect(await metrics.metrics()).toContain(
      'circuit_breaker_state{service="test-service",target="catalog-service"} 0',
    );
  });
});
