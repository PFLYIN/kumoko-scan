import { Dinheiro } from './dinheiro';
import { type DomainEvent, PedidoConcluido } from './events/pedido-concluido.event';
import type { IdempotencyKey } from './idempotency-key';
import { ItemPedido } from './item-pedido';
import type { ObraRef } from './obra-ref';
import { MAX_ITENS_DISTINTOS, type StatusPedido } from './pedido.constants';
import {
  LimiteDeItensExcedidoError,
  PedidoJaPersistidoError,
  PedidoVazioError,
  UsuarioInvalidoError,
} from './pedido.errors';
import type { Quantidade } from './quantidade';

/** Linha de entrada do pedido: obra (snapshot do catalogo), preco do catalogo e quantidade. */
export interface LinhaPedido {
  obra: ObraRef;
  preco: Dinheiro;
  quantidade: Quantidade;
}

export interface CriarPedidoOpcoes {
  idempotencyKey?: IdempotencyKey | null;
  /** Relogio injetavel (testes). */
  agora?: Date;
}

/** Estado persistido usado para reconstituir o aggregate (sem regras de criacao nem eventos). */
export interface PedidoSnapshot {
  id: number;
  usuarioId: number;
  status: StatusPedido;
  idempotencyKey: IdempotencyKey | null;
  criadoEm: Date;
  itens: ItemPedido[];
}

function assertUsuarioValido(usuarioId: number): void {
  if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
    throw new UsuarioInvalidoError(usuarioId);
  }
}

/**
 * Aggregate Root do contexto de Vendas.
 * Invariantes:
 * - pelo menos 1 item;
 * - no maximo 20 obras distintas;
 * - quantidade por obra de 1 a 99 (linhas da mesma obra sao somadas);
 * - total = soma dos subtotais (sempre calculado, nunca informado).
 */
export class Pedido {
  private _id: number | null;
  private readonly _itens: readonly ItemPedido[];
  private readonly _events: DomainEvent[] = [];
  /** true apenas para pedidos criados neste fluxo (ainda nao persistidos). */
  private readonly novo: boolean;

  private constructor(
    id: number | null,
    private readonly _usuarioId: number,
    private readonly _status: StatusPedido,
    itens: ItemPedido[],
    private readonly _idempotencyKey: IdempotencyKey | null,
    private readonly _criadoEm: Date,
    novo: boolean,
  ) {
    this._id = id;
    this._itens = Object.freeze([...itens]);
    this.novo = novo;
  }

  /** Factory: aplica todas as invariantes e cria um pedido CONCLUIDO. */
  static criar(usuarioId: number, linhas: readonly LinhaPedido[], opcoes: CriarPedidoOpcoes = {}): Pedido {
    assertUsuarioValido(usuarioId);
    if (linhas.length === 0) {
      throw new PedidoVazioError();
    }
    const itens = Pedido.consolidar(linhas);
    if (itens.length > MAX_ITENS_DISTINTOS) {
      throw new LimiteDeItensExcedidoError(itens.length);
    }
    return new Pedido(
      null,
      usuarioId,
      'CONCLUIDO',
      itens,
      opcoes.idempotencyKey ?? null,
      opcoes.agora ?? new Date(),
      true,
    );
  }

  /** Reconstitui um pedido ja persistido (usado pelo repositorio). Nao gera eventos. */
  static reconstituir(snapshot: PedidoSnapshot): Pedido {
    assertUsuarioValido(snapshot.usuarioId);
    if (snapshot.itens.length === 0) {
      throw new PedidoVazioError();
    }
    return new Pedido(
      snapshot.id,
      snapshot.usuarioId,
      snapshot.status,
      snapshot.itens,
      snapshot.idempotencyKey,
      snapshot.criadoEm,
      false,
    );
  }

  /** Junta linhas da mesma obra preservando a ordem da primeira ocorrencia. */
  private static consolidar(linhas: readonly LinhaPedido[]): ItemPedido[] {
    const porObra = new Map<number, ItemPedido>();
    for (const linha of linhas) {
      const item = ItemPedido.criar(linha.obra, linha.preco, linha.quantidade);
      const existente = porObra.get(item.obraId);
      porObra.set(item.obraId, existente ? existente.combinar(item) : item);
    }
    return [...porObra.values()];
  }

  get id(): number | null {
    return this._id;
  }

  get usuarioId(): number {
    return this._usuarioId;
  }

  get status(): StatusPedido {
    return this._status;
  }

  get itens(): readonly ItemPedido[] {
    return this._itens;
  }

  get idempotencyKey(): IdempotencyKey | null {
    return this._idempotencyKey;
  }

  get criadoEm(): Date {
    return this._criadoEm;
  }

  get total(): Dinheiro {
    return this._itens.reduce((acc, item) => acc.somar(item.subtotal), Dinheiro.ZERO);
  }

  get quantidadeTotal(): number {
    return this._itens.reduce((acc, item) => acc + item.quantidade.valor, 0);
  }

  pertenceA(usuarioId: number): boolean {
    return this._usuarioId === usuarioId;
  }

  /**
   * Recebe a identidade gerada pela persistencia (auto incremento). Para um pedido novo,
   * registra o domain event PedidoConcluido, cujo contrato exige o pedidoId.
   */
  atribuirId(id: number): void {
    if (this._id !== null) {
      throw new PedidoJaPersistidoError(this._id);
    }
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error(`Identidade de pedido invalida: ${String(id)}`);
    }
    this._id = id;
    if (this.novo && this._status === 'CONCLUIDO') {
      this._events.push(
        new PedidoConcluido(
          id,
          this._usuarioId,
          this.total,
          this._itens.map((item) => ({
            obraId: item.obraId,
            quantidade: item.quantidade.valor,
            precoUnitario: item.precoUnitario,
          })),
          new Date(),
        ),
      );
    }
  }

  /** Retorna e limpa os domain events pendentes. */
  pullDomainEvents(): DomainEvent[] {
    return this._events.splice(0, this._events.length);
  }
}
