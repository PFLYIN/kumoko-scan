import axios from 'axios';
import { RETRY_BASE_DELAY_MS, RETRY_MAX_DELAY_MS } from './catalogo.constants';

/** Codigos de erro de rede/timeout que justificam nova tentativa. */
const RETRIABLE_NETWORK_CODES = new Set([
  'ECONNABORTED',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
  'ERR_NETWORK',
]);

export interface FalhaClassificada {
  /** Pode tentar de novo (rede, timeout, 5xx). */
  retriable: boolean;
  /** Descricao curta para logs (ex.: "HTTP 500", "timeout"). */
  motivo: string;
  /** Status HTTP devolvido pelo catalogo, quando houve resposta. */
  status?: number;
}

/** Erro do opossum quando o circuito esta aberto (fail fast). */
export function isCircuitOpenError(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === 'EOPENBREAKER';
}

/** Classifica uma falha da chamada ao catalogo. 4xx nunca e retentado. */
export function classificarFalha(error: unknown): FalhaClassificada {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status !== undefined) {
      return { retriable: status >= 500, motivo: `HTTP ${status}`, status };
    }
    const code = error.code ?? 'desconhecido';
    const motivo = code === 'ECONNABORTED' || code === 'ETIMEDOUT' ? 'timeout' : `rede ${code}`;
    return { retriable: RETRIABLE_NETWORK_CODES.has(code) || code === 'desconhecido', motivo };
  }
  const code = (error as { code?: unknown } | null)?.code;
  // Timeout do proprio circuit breaker (opossum usa code ETIMEDOUT).
  if (code === 'ETIMEDOUT') {
    return { retriable: true, motivo: 'timeout' };
  }
  if (typeof code === 'string' && RETRIABLE_NETWORK_CODES.has(code)) {
    return { retriable: true, motivo: `rede ${code}` };
  }
  return { retriable: false, motivo: error instanceof Error ? error.message : String(error) };
}

/** 4xx do catalogo e erro do chamador: nao deve contar como falha no circuit breaker. */
export function isClientError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  const status = error.response?.status;
  return status !== undefined && status >= 400 && status < 500;
}

/**
 * Backoff exponencial com "equal jitter": metade fixa + metade aleatoria.
 * tentativa 1 -> 100..200ms, 2 -> 200..400ms, 3 -> 400..800ms (teto de 2s).
 */
export function calcularBackoffMs(
  tentativa: number,
  random: () => number = Math.random,
  baseMs = RETRY_BASE_DELAY_MS,
  maxMs = RETRY_MAX_DELAY_MS,
): number {
  const exponencial = Math.min(maxMs, baseMs * 2 ** Math.max(0, tentativa - 1));
  const metade = exponencial / 2;
  return Math.round(metade + random() * metade);
}
