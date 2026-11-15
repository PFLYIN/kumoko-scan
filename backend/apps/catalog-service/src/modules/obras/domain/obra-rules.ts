import { ObraDomainError } from './obra-domain.error';
import { tipoAceitaVolume, TipoObra, TIPOS_OBRA } from './tipo-obra';

export const PRECO_MINIMO = 0;
export const PRECO_MAXIMO = 9999.99;
export const AVALIACAO_MINIMA = 0;
export const AVALIACAO_MAXIMA = 5;
export const AVALIACAO_PADRAO = 5;
export const NOME_MAX = 255;
export const AUTOR_MAX = 255;
export const DESCRICAO_MAX = 5000;
export const VOLUME_MAXIMO = 9999;

/** Estado de uma obra relevante para as invariantes (sem detalhes de persistencia). */
export interface DadosObra {
  tipo: TipoObra;
  nome: string;
  autor: string | null;
  descricao: string | null;
  volume: number | null;
  preco: number;
  avaliacao: number;
}

/** Alteracao parcial: `undefined` mantem o valor atual; `null` limpa campos anulaveis. */
export type AlteracaoObra = Partial<DadosObra>;

function casasDecimais(valor: number): number {
  if (Number.isInteger(valor)) {
    return 0;
  }
  const texto = valor.toString();
  if (texto.includes('e-')) {
    return Number(texto.split('e-')[1]);
  }
  return texto.split('.')[1]?.length ?? 0;
}

export function validarTipo(tipo: unknown): TipoObra {
  if (!TIPOS_OBRA.includes(tipo as TipoObra)) {
    throw new ObraDomainError(`Tipo de obra inválido. Use: ${TIPOS_OBRA.join(', ')}.`);
  }
  return tipo as TipoObra;
}

export function validarNome(nome: unknown): string {
  const limpo = typeof nome === 'string' ? nome.trim() : '';
  if (limpo.length < 1 || limpo.length > NOME_MAX) {
    throw new ObraDomainError(`O nome da obra deve ter entre 1 e ${NOME_MAX} caracteres.`);
  }
  return limpo;
}

export function validarPreco(preco: unknown): number {
  if (typeof preco !== 'number' || !Number.isFinite(preco)) {
    throw new ObraDomainError('O preço deve ser um número.');
  }
  if (preco < PRECO_MINIMO || preco > PRECO_MAXIMO) {
    throw new ObraDomainError(`O preço deve estar entre ${PRECO_MINIMO} e ${PRECO_MAXIMO}.`);
  }
  if (casasDecimais(preco) > 2) {
    throw new ObraDomainError('O preço deve ter no máximo 2 casas decimais.');
  }
  return preco;
}

export function validarAvaliacao(avaliacao: unknown): number {
  if (typeof avaliacao !== 'number' || !Number.isFinite(avaliacao)) {
    throw new ObraDomainError('A avaliação deve ser um número.');
  }
  if (avaliacao < AVALIACAO_MINIMA || avaliacao > AVALIACAO_MAXIMA) {
    throw new ObraDomainError(`A avaliação deve estar entre ${AVALIACAO_MINIMA} e ${AVALIACAO_MAXIMA}.`);
  }
  if (casasDecimais(avaliacao) > 1) {
    throw new ObraDomainError('A avaliação deve ter no máximo 1 casa decimal.');
  }
  return avaliacao;
}

/** Livros nao tem volume (sempre null); mangas e novels aceitam inteiro positivo ou null. */
export function resolverVolume(tipo: TipoObra, volume: number | null | undefined): number | null {
  if (!tipoAceitaVolume(tipo) || volume === null || volume === undefined) {
    return null;
  }
  if (!Number.isInteger(volume) || volume < 1 || volume > VOLUME_MAXIMO) {
    throw new ObraDomainError(`O volume deve ser um número inteiro entre 1 e ${VOLUME_MAXIMO}.`);
  }
  return volume;
}

function normalizarTextoOpcional(valor: string | null, max: number, campo: string): string | null {
  if (valor === null || valor === undefined) {
    return null;
  }
  const limpo = valor.trim();
  if (limpo === '') {
    return null;
  }
  if (limpo.length > max) {
    throw new ObraDomainError(`O campo ${campo} deve ter no máximo ${max} caracteres.`);
  }
  return limpo;
}

/** Aplica todas as invariantes e devolve os dados normalizados (ou lanca ObraDomainError). */
export function normalizarObra(dados: DadosObra): DadosObra {
  const tipo = validarTipo(dados.tipo);
  return {
    tipo,
    nome: validarNome(dados.nome),
    autor: normalizarTextoOpcional(dados.autor, AUTOR_MAX, 'autor'),
    descricao: normalizarTextoOpcional(dados.descricao, DESCRICAO_MAX, 'descricao'),
    volume: resolverVolume(tipo, dados.volume),
    preco: validarPreco(dados.preco),
    avaliacao: validarAvaliacao(dados.avaliacao),
  };
}

/** Combina o estado atual com a alteracao e revalida tudo (ex.: mudar para livro zera o volume). */
export function aplicarAlteracao(atual: DadosObra, alteracao: AlteracaoObra): DadosObra {
  const escolher = <K extends keyof DadosObra>(campo: K): DadosObra[K] => {
    const novo = alteracao[campo];
    return novo !== undefined ? novo : atual[campo];
  };
  return normalizarObra({
    tipo: escolher('tipo'),
    nome: escolher('nome'),
    autor: escolher('autor'),
    descricao: escolher('descricao'),
    volume: escolher('volume'),
    preco: escolher('preco'),
    avaliacao: escolher('avaliacao'),
  });
}
