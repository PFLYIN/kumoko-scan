import { Dinheiro } from './dinheiro';
import { PedidoConcluido } from './events/pedido-concluido.event';
import { IdempotencyKey } from './idempotency-key';
import { ItemPedido } from './item-pedido';
import { ObraRef } from './obra-ref';
import { type LinhaPedido, Pedido } from './pedido';
import {
  LimiteDeItensExcedidoError,
  PedidoJaPersistidoError,
  PedidoVazioError,
  PrecoDivergenteError,
  QuantidadeMaximaPorObraExcedidaError,
  UsuarioInvalidoError,
} from './pedido.errors';
import { Quantidade } from './quantidade';

function linha(obraId: number, preco: number, quantidade: number): LinhaPedido {
  return {
    obra: ObraRef.criar({ obraId, nome: `Obra ${obraId}`, tipo: 'manga', capaUrl: null }),
    preco: Dinheiro.fromDecimal(preco),
    quantidade: Quantidade.de(quantidade),
  };
}

describe('Pedido (aggregate)', () => {
  it('cria pedido CONCLUIDO com total = soma dos subtotais', () => {
    const pedido = Pedido.criar(3, [linha(1, 29.9, 2), linha(2, 19.9, 1)]);
    expect(pedido.status).toBe('CONCLUIDO');
    expect(pedido.id).toBeNull();
    expect(pedido.itens).toHaveLength(2);
    expect(pedido.itens[0].subtotal.toNumber()).toBe(59.8);
    expect(pedido.total.toNumber()).toBe(79.7);
    expect(pedido.quantidadeTotal).toBe(3);
  });

  it('soma linhas da mesma obra mantendo a ordem', () => {
    const pedido = Pedido.criar(3, [linha(5, 10, 2), linha(7, 1, 1), linha(5, 10, 3)]);
    expect(pedido.itens.map((i) => [i.obraId, i.quantidade.valor])).toEqual([
      [5, 5],
      [7, 1],
    ]);
    expect(pedido.total.toNumber()).toBe(51);
  });

  it('rejeita soma da mesma obra acima de 99', () => {
    expect(() => Pedido.criar(3, [linha(5, 10, 60), linha(5, 10, 40)])).toThrow(
      QuantidadeMaximaPorObraExcedidaError,
    );
  });

  it('rejeita a mesma obra com precos diferentes', () => {
    expect(() => Pedido.criar(3, [linha(5, 10, 1), linha(5, 11, 1)])).toThrow(PrecoDivergenteError);
  });

  it('rejeita pedido vazio', () => {
    expect(() => Pedido.criar(3, [])).toThrow(PedidoVazioError);
  });

  it('aceita 20 obras distintas e rejeita 21', () => {
    const vinte = Array.from({ length: 20 }, (_, i) => linha(i + 1, 1, 1));
    expect(Pedido.criar(3, vinte).itens).toHaveLength(20);
    expect(() => Pedido.criar(3, [...vinte, linha(21, 1, 1)])).toThrow(LimiteDeItensExcedidoError);
  });

  it('21 linhas de 20 obras distintas sao aceitas (consolidacao antes do limite)', () => {
    const linhas = [...Array.from({ length: 20 }, (_, i) => linha(i + 1, 1, 1)), linha(1, 1, 1)];
    expect(Pedido.criar(3, linhas).itens).toHaveLength(20);
  });

  it('rejeita usuario invalido', () => {
    expect(() => Pedido.criar(0, [linha(1, 1, 1)])).toThrow(UsuarioInvalidoError);
  });

  it('itens sao somente leitura', () => {
    const pedido = Pedido.criar(3, [linha(1, 1, 1)]);
    expect(() => (pedido.itens as ItemPedido[]).push(pedido.itens[0])).toThrow(TypeError);
  });

  it('registra PedidoConcluido ao receber identidade, uma unica vez', () => {
    const chave = IdempotencyKey.criar('k1');
    const pedido = Pedido.criar(3, [linha(1, 29.9, 3)], { idempotencyKey: chave });
    expect(pedido.pullDomainEvents()).toEqual([]);
    pedido.atribuirId(12);
    const eventos = pedido.pullDomainEvents();
    expect(eventos).toHaveLength(1);
    const evento = eventos[0] as PedidoConcluido;
    expect(evento).toBeInstanceOf(PedidoConcluido);
    expect(evento.pedidoId).toBe(12);
    expect(evento.total.toNumber()).toBe(89.7);
    expect(evento.itens[0]).toMatchObject({ obraId: 1, quantidade: 3 });
    expect(pedido.pullDomainEvents()).toEqual([]);
    expect(() => pedido.atribuirId(13)).toThrow(PedidoJaPersistidoError);
    expect(pedido.idempotencyKey?.valor).toBe('k1');
  });

  it('pedido reconstituido nao gera eventos', () => {
    const item = ItemPedido.criar(linha(1, 5, 1).obra, Dinheiro.fromDecimal(5), Quantidade.de(1));
    const pedido = Pedido.reconstituir({
      id: 4,
      usuarioId: 3,
      status: 'CONCLUIDO',
      idempotencyKey: null,
      criadoEm: new Date(),
      itens: [item],
    });
    expect(pedido.pertenceA(3)).toBe(true);
    expect(pedido.pertenceA(9)).toBe(false);
    expect(pedido.pullDomainEvents()).toEqual([]);
  });
});
