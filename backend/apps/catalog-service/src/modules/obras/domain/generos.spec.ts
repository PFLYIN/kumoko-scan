import {
  canonicalizarGenero,
  chaveGenero,
  contarGeneros,
  normalizarGeneros,
  rankearRelacionadas,
} from './generos';
import { ObraDomainError } from './obra-domain.error';

describe('generos', () => {
  it('canonicaliza espacos e primeira letra', () => {
    expect(canonicalizarGenero('  slice   of life ')).toBe('Slice of life');
    expect(canonicalizarGenero('ação')).toBe('Ação');
  });

  it('normaliza string separada por virgula, removendo vazios e duplicados', () => {
    expect(normalizarGeneros('acao, Fantasia,, Ação ,isekai')).toEqual(['Acao', 'Fantasia', 'Isekai']);
    expect(normalizarGeneros(['Romance', 'comédia, drama'])).toEqual(['Romance', 'Comédia', 'Drama']);
    expect(normalizarGeneros(undefined)).toEqual([]);
    expect(normalizarGeneros('')).toEqual([]);
  });

  it('rejeita generos invalidos, longos ou em excesso', () => {
    expect(() => normalizarGeneros('a')).toThrow(ObraDomainError);
    expect(() => normalizarGeneros('x'.repeat(31))).toThrow(ObraDomainError);
    expect(() => normalizarGeneros('<script>')).toThrow(ObraDomainError);
    expect(() => normalizarGeneros('a1,b2,c3,d4,e5,f6,g7,h8,i9')).toThrow(/no máximo 8/);
    expect(() => normalizarGeneros(42)).toThrow(ObraDomainError);
  });

  it('chave ignora acento e caixa', () => {
    expect(chaveGenero('Ação')).toBe(chaveGenero('acao'));
  });

  it('conta generos agrupando grafias e ordena por total', () => {
    expect(contarGeneros([['Ação', 'Fantasia'], ['acao'], ['Romance', 'Fantasia'], ['Ação']])).toEqual([
      { genero: 'Ação', total: 3 },
      { genero: 'Fantasia', total: 2 },
      { genero: 'Romance', total: 1 },
    ]);
  });

  it('rankeia relacionadas por generos em comum, tipo e vendas', () => {
    const base = { id: 1, tipo: 'manga', generos: ['Ação', 'Fantasia'], totalVendido: 0, avaliacao: 5 };
    const candidatas = [
      base,
      { id: 2, tipo: 'novel', generos: ['acao', 'Fantasia'], totalVendido: 0, avaliacao: 4 },
      { id: 3, tipo: 'manga', generos: ['Romance'], totalVendido: 10, avaliacao: 4 },
      { id: 4, tipo: 'livro', generos: ['Drama'], totalVendido: 50, avaliacao: 5 },
      { id: 5, tipo: 'manga', generos: ['Fantasia'], totalVendido: 1, avaliacao: 4 },
      { id: 6, tipo: 'manga', generos: [], totalVendido: 20, avaliacao: 4 },
    ];
    expect(rankearRelacionadas(base, candidatas, 10).map((o) => o.id)).toEqual([2, 5, 6, 3]);
    expect(rankearRelacionadas(base, candidatas, 2).map((o) => o.id)).toEqual([2, 5]);
  });
});
