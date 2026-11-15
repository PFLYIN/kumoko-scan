import { ObraDomainError } from './obra-domain.error';

export const GENEROS_MAX = 8;
export const GENERO_MIN = 2;
export const GENERO_MAX = 30;
/** Letras (com acento), digitos, espaco, hifen e apostrofo. */
const GENERO_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} '-]*$/u;

/** Forma canonica de um genero: espacos colapsados e primeira letra maiuscula ("slice of life" -> "Slice of life"). */
export function canonicalizarGenero(bruto: string): string {
  const limpo = bruto.trim().replace(/\s+/g, ' ');
  return limpo.charAt(0).toLocaleUpperCase('pt-BR') + limpo.slice(1);
}

/**
 * Normaliza a lista de generos vinda do formulario (string "Acao, Fantasia" ou array).
 * Remove vazios e duplicados (sem diferenciar maiusculas/acentos), valida tamanho e caracteres.
 */
export function normalizarGeneros(entrada: unknown): string[] {
  if (entrada === undefined || entrada === null) {
    return [];
  }
  const partes = Array.isArray(entrada)
    ? entrada.flatMap((item) => String(item).split(','))
    : typeof entrada === 'string'
      ? entrada.split(',')
      : null;
  if (partes === null) {
    throw new ObraDomainError('generos deve ser uma lista de textos separados por vírgula.');
  }
  const vistos = new Set<string>();
  const generos: string[] = [];
  for (const parte of partes) {
    const genero = canonicalizarGenero(parte);
    if (genero === '') {
      continue;
    }
    if (genero.length < GENERO_MIN || genero.length > GENERO_MAX || !GENERO_PATTERN.test(genero)) {
      throw new ObraDomainError(
        `Gênero inválido: "${genero}". Use de ${GENERO_MIN} a ${GENERO_MAX} letras, números, espaços ou hífen.`,
      );
    }
    const chave = chaveGenero(genero);
    if (!vistos.has(chave)) {
      vistos.add(chave);
      generos.push(genero);
    }
  }
  if (generos.length > GENEROS_MAX) {
    throw new ObraDomainError(`Informe no máximo ${GENEROS_MAX} gêneros.`);
  }
  return generos;
}

/** Chave de comparacao: minusculas e sem acentos ("Ação" == "acao"). */
export function chaveGenero(genero: string): string {
  return genero.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase();
}

export interface GeneroContagem {
  genero: string;
  total: number;
}

/** Conta obras por genero (agrupando grafias equivalentes) em ordem de popularidade e depois alfabetica. */
export function contarGeneros(listas: readonly (readonly string[])[]): GeneroContagem[] {
  const porChave = new Map<string, GeneroContagem>();
  for (const lista of listas) {
    for (const genero of lista) {
      const chave = chaveGenero(genero);
      const atual = porChave.get(chave);
      if (atual) {
        atual.total += 1;
      } else {
        porChave.set(chave, { genero, total: 1 });
      }
    }
  }
  return [...porChave.values()].sort(
    (a, b) => b.total - a.total || a.genero.localeCompare(b.genero, 'pt-BR'),
  );
}

export interface CandidataRelacionada {
  id: number;
  tipo: string;
  generos: readonly string[];
  totalVendido: number;
  avaliacao: number;
}

/**
 * Pontua obras relacionadas: 2 pontos por genero em comum + 1 se for do mesmo tipo.
 * Descarta a propria obra e as sem afinidade; desempata por vendas, avaliacao e id.
 */
export function rankearRelacionadas<T extends CandidataRelacionada>(
  base: CandidataRelacionada,
  candidatas: readonly T[],
  limite: number,
): T[] {
  const generosBase = new Set(base.generos.map(chaveGenero));
  return candidatas
    .filter((c) => c.id !== base.id)
    .map((c) => {
      const comuns = c.generos.filter((g) => generosBase.has(chaveGenero(g))).length;
      return { obra: c, pontos: comuns * 2 + (c.tipo === base.tipo ? 1 : 0) };
    })
    .filter((item) => item.pontos > 0)
    .sort(
      (a, b) =>
        b.pontos - a.pontos ||
        b.obra.totalVendido - a.obra.totalVendido ||
        b.obra.avaliacao - a.obra.avaliacao ||
        a.obra.id - b.obra.id,
    )
    .slice(0, limite)
    .map((item) => item.obra);
}
