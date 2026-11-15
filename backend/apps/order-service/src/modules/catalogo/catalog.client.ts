import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@kumoko/cache';
import { getRequestId, REQUEST_ID_HEADER } from '@kumoko/observability';
import type { AxiosInstance } from 'axios';
import CircuitBreaker from 'opossum';
import {
  CATALOG_HTTP_CLIENT,
  CATALOG_LOTE_PATH,
  CATALOG_PRECOS_CACHE_TTL_SECONDS,
  CATALOG_SERVICE_NAME,
  CATALOGO_INDISPONIVEL_MESSAGE,
  CATALOGO_RESPOSTA_INVALIDA_MESSAGE,
  CIRCUIT_ERROR_THRESHOLD_PERCENTAGE,
  CIRCUIT_RESET_TIMEOUT_MS,
  CIRCUIT_TIMEOUT_MARGIN_MS,
  CIRCUIT_VOLUME_THRESHOLD,
  catalogPrecosCacheKey,
  normalizeIds,
} from './catalogo.constants';
import {
  CatalogRespostaInvalidaError,
  type ObraCatalogo,
  type ObraCatalogoSnapshot,
  toObraCatalogo,
  translateLoteResponse,
} from './obra-catalogo.translator';
import { calcularBackoffMs, classificarFalha, isCircuitOpenError, isClientError } from './retry-policy';

export type EstadoCircuito = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/** Espera injetavel (testes usam espera instantanea). */
export const CATALOG_SLEEP = Symbol('CATALOG_SLEEP');
export type Sleep = (ms: number) => Promise<void>;
export const defaultSleep: Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Anti-Corruption Layer para o catalog-service.
 * Cada tentativa HTTP passa pelo circuit breaker; o retry (backoff exponencial + jitter)
 * fica por fora, so para rede/timeout/5xx. Circuito aberto => falha imediata (503).
 */
@Injectable()
export class CatalogClient implements OnModuleDestroy {
  private readonly logger = new Logger(CatalogClient.name);
  private readonly breaker: CircuitBreaker<[number[]], unknown>;
  private readonly retries: number;

  constructor(
    @Inject(CATALOG_HTTP_CLIENT) private readonly http: AxiosInstance,
    private readonly cache: CacheService,
    config: ConfigService,
    @Inject(CATALOG_SLEEP) private readonly sleep: Sleep,
  ) {
    this.retries = Number(config.get('CATALOG_RETRIES') ?? 2);
    const timeoutMs = Number(config.get('CATALOG_TIMEOUT_MS') ?? 2000);
    this.breaker = new CircuitBreaker((ids: number[]) => this.requisitarLote(ids), {
      name: CATALOG_SERVICE_NAME,
      timeout: timeoutMs + CIRCUIT_TIMEOUT_MARGIN_MS,
      errorThresholdPercentage: CIRCUIT_ERROR_THRESHOLD_PERCENTAGE,
      resetTimeout: CIRCUIT_RESET_TIMEOUT_MS,
      volumeThreshold: CIRCUIT_VOLUME_THRESHOLD,
      // 4xx e erro do chamador, nao do catalogo: nao conta como falha.
      errorFilter: (error: unknown) => isClientError(error),
    });
    this.breaker.on('open', () => this.logger.warn(`Circuit breaker OPEN servico=${CATALOG_SERVICE_NAME}`));
    this.breaker.on('halfOpen', () =>
      this.logger.log(`Circuit breaker HALF_OPEN servico=${CATALOG_SERVICE_NAME} (testando o catalogo)`),
    );
    this.breaker.on('close', () => this.logger.log(`Circuit breaker CLOSED servico=${CATALOG_SERVICE_NAME}`));
  }

  onModuleDestroy(): void {
    this.breaker.shutdown();
  }

  get estadoCircuito(): EstadoCircuito {
    if (this.breaker.opened) {
      return 'OPEN';
    }
    return this.breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED';
  }

  /**
   * Busca as obras pelo id (cache-aside de 30s). Ids inexistentes simplesmente nao aparecem no mapa.
   * Lanca 503 se o catalogo estiver indisponivel e 502 se responder fora do contrato.
   */
  async buscarObras(ids: readonly number[]): Promise<Map<number, ObraCatalogo>> {
    const normalizados = normalizeIds(ids);
    const resultado = new Map<number, ObraCatalogo>();
    if (normalizados.length === 0) {
      return resultado;
    }
    const { value } = await this.cache.getOrSet<ObraCatalogoSnapshot[]>(
      catalogPrecosCacheKey(normalizados),
      CATALOG_PRECOS_CACHE_TTL_SECONDS,
      () => this.buscarComRetry(normalizados),
    );
    for (const snapshot of value) {
      resultado.set(snapshot.obraId, toObraCatalogo(snapshot));
    }
    return resultado;
  }

  private async buscarComRetry(ids: number[]): Promise<ObraCatalogoSnapshot[]> {
    const maxTentativas = this.retries + 1;
    for (let tentativa = 1; ; tentativa++) {
      try {
        const body = await this.breaker.fire(ids);
        return translateLoteResponse(body);
      } catch (error) {
        if (error instanceof CatalogRespostaInvalidaError) {
          this.logger.error(`Catalogo respondeu fora do contrato: ${error.message}`);
          throw new BadGatewayException(CATALOGO_RESPOSTA_INVALIDA_MESSAGE);
        }
        if (isCircuitOpenError(error)) {
          this.logger.warn('Fallback: catalogo indisponivel (circuito aberto)');
          throw new ServiceUnavailableException(CATALOGO_INDISPONIVEL_MESSAGE);
        }
        const falha = classificarFalha(error);
        if (!falha.retriable) {
          this.logger.error(`Chamada ao catalogo falhou sem retry motivo=${falha.motivo}`);
          throw new ServiceUnavailableException(CATALOGO_INDISPONIVEL_MESSAGE);
        }
        if (tentativa >= maxTentativas) {
          this.logger.warn(
            `Fallback: catalogo indisponivel apos ${tentativa} tentativa(s) motivo=${falha.motivo}`,
          );
          throw new ServiceUnavailableException(CATALOGO_INDISPONIVEL_MESSAGE);
        }
        const espera = calcularBackoffMs(tentativa);
        this.logger.warn(
          `Retry chamada catalogo tentativa=${tentativa + 1}/${maxTentativas} motivo=${falha.motivo} espera=${espera}ms`,
        );
        await this.sleep(espera);
      }
    }
  }

  /** Uma unica chamada HTTP (executada dentro do circuit breaker). */
  private async requisitarLote(ids: number[]): Promise<unknown> {
    const requestId = getRequestId();
    const response = await this.http.get<unknown>(CATALOG_LOTE_PATH, {
      params: { ids: ids.join(',') },
      headers: requestId ? { [REQUEST_ID_HEADER]: requestId } : undefined,
    });
    return response.data;
  }
}
