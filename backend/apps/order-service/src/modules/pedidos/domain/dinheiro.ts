import { DinheiroInvalidoError } from './pedido.errors';

/**
 * Value Object monetario (BRL). Guarda centavos inteiros para evitar erro de ponto flutuante.
 * Imutavel e nunca negativo.
 */
export class Dinheiro {
  private constructor(private readonly _centavos: number) {}

  static readonly ZERO = new Dinheiro(0);

  static fromCentavos(centavos: number): Dinheiro {
    if (!Number.isSafeInteger(centavos) || centavos < 0) {
      throw new DinheiroInvalidoError(centavos);
    }
    return new Dinheiro(centavos);
  }

  /** Converte um valor decimal (ex.: 29.9) em centavos. Rejeita mais de 2 casas decimais. */
  static fromDecimal(valor: number): Dinheiro {
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) {
      throw new DinheiroInvalidoError(valor);
    }
    const centavos = Math.round(valor * 100);
    // Tolerancia para a representacao binaria (19.9 * 100 = 1989.9999999999998).
    if (Math.abs(valor * 100 - centavos) > 1e-6) {
      throw new DinheiroInvalidoError(valor);
    }
    return Dinheiro.fromCentavos(centavos);
  }

  get centavos(): number {
    return this._centavos;
  }

  somar(outro: Dinheiro): Dinheiro {
    return Dinheiro.fromCentavos(this._centavos + outro._centavos);
  }

  /** Multiplica por um fator inteiro nao negativo (tipicamente a quantidade de um item). */
  multiplicar(fator: number | { valor: number }): Dinheiro {
    const n = typeof fator === 'number' ? fator : fator.valor;
    if (!Number.isSafeInteger(n) || n < 0) {
      throw new DinheiroInvalidoError(`fator ${String(n)}`);
    }
    return Dinheiro.fromCentavos(this._centavos * n);
  }

  equals(outro: Dinheiro): boolean {
    return this._centavos === outro._centavos;
  }

  /** Valor decimal com 2 casas (ex.: 89.7). */
  toNumber(): number {
    return Number((this._centavos / 100).toFixed(2));
  }

  /** Serializacao JSON como number com 2 casas (contrato da API). */
  toJSON(): number {
    return this.toNumber();
  }

  /** Representacao textual para logs (ex.: "89.70"). */
  toString(): string {
    return (this._centavos / 100).toFixed(2);
  }
}
