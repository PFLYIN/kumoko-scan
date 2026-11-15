import { QUANTIDADE_MAXIMA, QUANTIDADE_MINIMA } from './pedido.constants';
import { QuantidadeInvalidaError } from './pedido.errors';

/** Value Object: quantidade de unidades de uma obra no pedido (inteiro de 1 a 99). */
export class Quantidade {
  private constructor(private readonly _valor: number) {}

  static de(valor: number): Quantidade {
    if (!Quantidade.isValida(valor)) {
      throw new QuantidadeInvalidaError(valor);
    }
    return new Quantidade(valor);
  }

  static isValida(valor: number): boolean {
    return Number.isInteger(valor) && valor >= QUANTIDADE_MINIMA && valor <= QUANTIDADE_MAXIMA;
  }

  get valor(): number {
    return this._valor;
  }

  /** Soma duas quantidades; lanca QuantidadeInvalidaError se o resultado passar de 99. */
  somar(outra: Quantidade): Quantidade {
    return Quantidade.de(this._valor + outra._valor);
  }

  equals(outra: Quantidade): boolean {
    return this._valor === outra._valor;
  }

  toJSON(): number {
    return this._valor;
  }
}
