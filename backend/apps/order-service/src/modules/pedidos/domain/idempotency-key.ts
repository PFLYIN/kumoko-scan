import { IdempotencyKeyInvalidaError } from './pedido.errors';

const FORMATO = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Value Object: chave de idempotencia enviada pelo cliente (header Idempotency-Key).
 * Mesma chave + mesmo usuario => mesmo pedido (evita compra duplicada em retentativas).
 */
export class IdempotencyKey {
  private constructor(private readonly _valor: string) {}

  static criar(valor: string): IdempotencyKey {
    if (typeof valor !== 'string' || !FORMATO.test(valor)) {
      throw new IdempotencyKeyInvalidaError();
    }
    return new IdempotencyKey(valor);
  }

  /** Header ausente ou vazio => sem idempotencia. */
  static opcional(valor: string | null | undefined): IdempotencyKey | null {
    if (valor === undefined || valor === null || valor.trim() === '') {
      return null;
    }
    return IdempotencyKey.criar(valor.trim());
  }

  get valor(): string {
    return this._valor;
  }

  equals(outra: IdempotencyKey): boolean {
    return this._valor === outra._valor;
  }

  toString(): string {
    return this._valor;
  }
}
