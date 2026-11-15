import { Dinheiro } from './dinheiro';
import { IdempotencyKey } from './idempotency-key';
import { ObraRef } from './obra-ref';
import {
  DinheiroInvalidoError,
  IdempotencyKeyInvalidaError,
  ObraRefInvalidaError,
  QuantidadeInvalidaError,
} from './pedido.errors';
import { Quantidade } from './quantidade';

describe('Dinheiro', () => {
  it('converte decimal em centavos inteiros sem erro de ponto flutuante', () => {
    expect(Dinheiro.fromDecimal(19.9).centavos).toBe(1990);
    expect(Dinheiro.fromDecimal(0.1).somar(Dinheiro.fromDecimal(0.2)).toNumber()).toBe(0.3);
  });

  it('soma, multiplica e compara por valor', () => {
    const preco = Dinheiro.fromDecimal(29.9);
    expect(preco.multiplicar(3).toNumber()).toBe(89.7);
    expect(preco.multiplicar(Quantidade.de(2)).equals(Dinheiro.fromCentavos(5980))).toBe(true);
    expect(preco.toString()).toBe('29.90');
    expect(JSON.stringify({ total: preco })).toBe('{"total":29.9}');
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, 1.234])('rejeita valor invalido %p', (valor) => {
    expect(() => Dinheiro.fromDecimal(valor)).toThrow(DinheiroInvalidoError);
  });

  it('rejeita centavos negativos/fracionarios e fator negativo', () => {
    expect(() => Dinheiro.fromCentavos(-5)).toThrow(DinheiroInvalidoError);
    expect(() => Dinheiro.fromCentavos(1.5)).toThrow(DinheiroInvalidoError);
    expect(() => Dinheiro.fromCentavos(100).multiplicar(-1)).toThrow(DinheiroInvalidoError);
  });
});

describe('Quantidade', () => {
  it('aceita inteiros de 1 a 99', () => {
    expect(Quantidade.de(1).valor).toBe(1);
    expect(Quantidade.de(99).valor).toBe(99);
    expect(Quantidade.de(2).equals(Quantidade.de(2))).toBe(true);
  });

  it.each([0, 100, -3, 1.5, Number.NaN])('rejeita %p', (valor) => {
    expect(() => Quantidade.de(valor)).toThrow(QuantidadeInvalidaError);
  });

  it('somar respeita o maximo', () => {
    expect(Quantidade.de(40).somar(Quantidade.de(59)).valor).toBe(99);
    expect(() => Quantidade.de(50).somar(Quantidade.de(50))).toThrow(QuantidadeInvalidaError);
  });
});

describe('ObraRef', () => {
  const base = { obraId: 1, nome: ' Dandadan ', tipo: 'manga' as const, capaUrl: '' };

  it('normaliza nome e capa vazia', () => {
    const ref = ObraRef.criar(base);
    expect(ref.nome).toBe('Dandadan');
    expect(ref.capaUrl).toBeNull();
    expect(ref.equals(ObraRef.criar(base))).toBe(true);
  });

  it('rejeita id, nome e tipo invalidos', () => {
    expect(() => ObraRef.criar({ ...base, obraId: 0 })).toThrow(ObraRefInvalidaError);
    expect(() => ObraRef.criar({ ...base, nome: '  ' })).toThrow(ObraRefInvalidaError);
    expect(() => ObraRef.criar({ ...base, tipo: 'hq' as never })).toThrow(ObraRefInvalidaError);
  });
});

describe('IdempotencyKey', () => {
  it('aceita formato valido e trata ausencia como null', () => {
    expect(IdempotencyKey.criar('abc-123_X').valor).toBe('abc-123_X');
    expect(IdempotencyKey.opcional(undefined)).toBeNull();
    expect(IdempotencyKey.opcional('  ')).toBeNull();
    expect(IdempotencyKey.opcional(' k1 ')?.valor).toBe('k1');
  });

  it.each(['com espaco', 'a'.repeat(65), 'ç', 'x;drop'])('rejeita %p', (valor) => {
    expect(() => IdempotencyKey.criar(valor)).toThrow(IdempotencyKeyInvalidaError);
  });
});
