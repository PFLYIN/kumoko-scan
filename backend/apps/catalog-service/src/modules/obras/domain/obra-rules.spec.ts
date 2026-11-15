import { ObraDomainError } from './obra-domain.error';
import { aplicarAlteracao, normalizarObra, type DadosObra } from './obra-rules';
import { parseLoteIds } from './lote-ids';
import { TipoObra } from './tipo-obra';

const base: DadosObra = {
  tipo: TipoObra.Manga,
  nome: '  Dandadan  ',
  autor: ' ',
  descricao: 'Descricao',
  volume: 3,
  preco: 39.9,
  avaliacao: 4.5,
};

describe('regras de obra', () => {
  it('normaliza textos: trim e vazio vira null', () => {
    const obra = normalizarObra(base);
    expect(obra.nome).toBe('Dandadan');
    expect(obra.autor).toBeNull();
    expect(obra.volume).toBe(3);
  });

  it.each([
    ['preco negativo', { preco: -0.01 }],
    ['preco acima de 9999.99', { preco: 10000 }],
    ['preco com 3 casas', { preco: 10.123 }],
    ['avaliacao acima de 5', { avaliacao: 5.1 }],
    ['avaliacao negativa', { avaliacao: -1 }],
    ['nome vazio', { nome: '   ' }],
    ['nome com 256 caracteres', { nome: 'a'.repeat(256) }],
    ['tipo invalido', { tipo: 'revista' as TipoObra }],
    ['volume zero', { volume: 0 }],
    ['volume fracionado', { volume: 1.5 }],
  ])('rejeita %s', (_caso, alteracao) => {
    expect(() => normalizarObra({ ...base, ...alteracao })).toThrow(ObraDomainError);
  });

  it('aceita limites: preco 0 e 9999.99, avaliacao 0 e 5', () => {
    expect(normalizarObra({ ...base, preco: 0, avaliacao: 0 }).preco).toBe(0);
    expect(normalizarObra({ ...base, preco: 9999.99, avaliacao: 5 }).avaliacao).toBe(5);
  });

  it('livro forca volume null; novel mantem volume', () => {
    expect(normalizarObra({ ...base, tipo: TipoObra.Livro, volume: 7 }).volume).toBeNull();
    expect(normalizarObra({ ...base, tipo: TipoObra.Novel, volume: 7 }).volume).toBe(7);
  });

  it('aplicarAlteracao: undefined mantem, null limpa e mudar para livro zera volume', () => {
    const atual = normalizarObra({ ...base, autor: 'Tatsu' });
    const alterada = aplicarAlteracao(atual, { tipo: TipoObra.Livro, autor: null, preco: undefined });
    expect(alterada).toMatchObject({ tipo: TipoObra.Livro, autor: null, volume: null, preco: 39.9 });
  });
});

describe('parseLoteIds', () => {
  it('converte, remove duplicados e preserva a ordem', () => {
    expect(parseLoteIds(' 3, 1,3 ,2')).toEqual([3, 1, 2]);
  });

  it.each([undefined, '', '1,,2', 'a,1', '-1', '0', '1.5', '99999999999'])('rejeita %p', (valor) => {
    expect(() => parseLoteIds(valor)).toThrow(ObraDomainError);
  });

  it('aceita 50 ids e rejeita 51', () => {
    const ids = (n: number) => Array.from({ length: n }, (_, i) => i + 1).join(',');
    expect(parseLoteIds(ids(50))).toHaveLength(50);
    expect(() => parseLoteIds(ids(51))).toThrow('no máximo 50');
  });
});
