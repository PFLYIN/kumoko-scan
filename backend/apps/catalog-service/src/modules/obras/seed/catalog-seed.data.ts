import { TipoObra } from '../domain/tipo-obra';
import type { DadosObra } from '../domain/obra-rules';

export const PRECO_SEED_MIN = 19.9;
export const PRECO_SEED_MAX = 59.9;

/** Preco deterministico entre 19.90 e 59.90 derivado do indice (passos de R$ 1,00). */
export function precoSeed(indice: number): number {
  const faixa = Math.round(PRECO_SEED_MAX - PRECO_SEED_MIN); // 40
  const passo = (indice * 7) % (faixa + 1);
  return Math.round((PRECO_SEED_MIN + passo) * 100) / 100;
}

/** Avaliacao deterministica entre 4.0 e 5.0. */
export function avaliacaoSeed(indice: number): number {
  return Math.round((4 + ((indice * 3) % 11) / 10) * 10) / 10;
}

/** `Kage_no_Jitsuryokusha_ni_Naritakute!.jpg` -> `Kage no Jitsuryokusha ni Naritakute!` */
export function nomeDoArquivo(arquivo: string): string {
  return arquivo
    .replace(/\.[^.]+$/, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function mangaSeed(arquivo: string, indice: number): DadosObra {
  const nome = nomeDoArquivo(arquivo);
  return {
    tipo: TipoObra.Manga,
    nome,
    autor: null,
    descricao: `Volume 1 de ${nome}. Edição do acervo Kumoko Scan.`,
    volume: 1,
    preco: precoSeed(indice),
    avaliacao: avaliacaoSeed(indice),
  };
}

/** Obras de exemplo sem capa (2 livros e 2 light novels). */
export const OBRAS_SEM_CAPA: readonly DadosObra[] = [
  {
    tipo: TipoObra.Livro,
    nome: 'Dom Casmurro',
    autor: 'Machado de Assis',
    descricao:
      'Bentinho relembra a juventude e o ciúme que nutre por Capitu neste clássico da literatura brasileira.',
    volume: null,
    preco: 34.9,
    avaliacao: 4.8,
  },
  {
    tipo: TipoObra.Livro,
    nome: 'O Cortiço',
    autor: 'Aluísio Azevedo',
    descricao: 'Retrato naturalista da vida em um cortiço do Rio de Janeiro no século XIX.',
    volume: null,
    preco: 29.9,
    avaliacao: 4.5,
  },
  {
    tipo: TipoObra.Novel,
    nome: 'Mushoku Tensei',
    autor: 'Rifujin na Magonote',
    descricao: 'Um homem reencarna em um mundo de magia e decide viver sem arrependimentos.',
    volume: 1,
    preco: 49.9,
    avaliacao: 4.7,
  },
  {
    tipo: TipoObra.Novel,
    nome: 'Re:Zero - Começando uma Vida em Outro Mundo',
    autor: 'Tappei Nagatsuki',
    descricao: 'Subaru é transportado para outro mundo e descobre que volta no tempo sempre que morre.',
    volume: 1,
    preco: 44.9,
    avaliacao: 4.6,
  },
];
