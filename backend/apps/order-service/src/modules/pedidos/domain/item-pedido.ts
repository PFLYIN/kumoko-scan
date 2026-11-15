import type { Dinheiro } from './dinheiro';
import type { ObraRef } from './obra-ref';
import { QUANTIDADE_MAXIMA } from './pedido.constants';
import { PrecoDivergenteError, QuantidadeMaximaPorObraExcedidaError } from './pedido.errors';
import { Quantidade } from './quantidade';

/**
 * Entity interna do aggregate Pedido. A identidade local e a obra (um item por obra);
 * so e criada/alterada pela raiz (Pedido).
 */
export class ItemPedido {
  private constructor(
    private readonly _obra: ObraRef,
    private readonly _precoUnitario: Dinheiro,
    private readonly _quantidade: Quantidade,
  ) {}

  static criar(obra: ObraRef, precoUnitario: Dinheiro, quantidade: Quantidade): ItemPedido {
    return new ItemPedido(obra, precoUnitario, quantidade);
  }

  get obra(): ObraRef {
    return this._obra;
  }

  get obraId(): number {
    return this._obra.obraId;
  }

  get precoUnitario(): Dinheiro {
    return this._precoUnitario;
  }

  get quantidade(): Quantidade {
    return this._quantidade;
  }

  get subtotal(): Dinheiro {
    return this._precoUnitario.multiplicar(this._quantidade);
  }

  /** Mesma identidade = mesma obra. */
  mesmaObra(outro: ItemPedido): boolean {
    return this.obraId === outro.obraId;
  }

  /**
   * Junta outro item da mesma obra somando as quantidades (retorna um novo item).
   * Regras: mesmo preco unitario e total da obra ate 99 unidades.
   */
  combinar(outro: ItemPedido): ItemPedido {
    if (!this.mesmaObra(outro)) {
      throw new Error('Itens de obras diferentes nao podem ser combinados.');
    }
    if (!this._precoUnitario.equals(outro._precoUnitario)) {
      throw new PrecoDivergenteError(this.obraId);
    }
    const total = this._quantidade.valor + outro._quantidade.valor;
    if (total > QUANTIDADE_MAXIMA) {
      throw new QuantidadeMaximaPorObraExcedidaError(this.obraId, total);
    }
    return new ItemPedido(this._obra, this._precoUnitario, Quantidade.de(total));
  }
}
