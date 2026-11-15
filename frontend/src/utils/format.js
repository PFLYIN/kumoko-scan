const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dataCurta = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });
const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export function formatPreco(valor) {
  const n = Number(valor);
  return moeda.format(Number.isFinite(n) ? n : 0);
}

export function formatData(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '--' : dataCurta.format(d);
}

export function formatDataHora(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '--' : dataHora.format(d);
}

// Capitulos podem ser fracionados (ex.: 10.5); evita exibir "10.00".
export function formatNumeroCapitulo(numero) {
  const n = Number(numero);
  return Number.isInteger(n) ? String(n) : n.toLocaleString('pt-BR');
}

export const TIPOS_OBRA = [
  { value: 'manga', label: 'Mangá', plural: 'Mangás' },
  { value: 'livro', label: 'Livro', plural: 'Livros' },
  { value: 'novel', label: 'Light novel', plural: 'Novels' },
];

export function tipoLabel(tipo) {
  return TIPOS_OBRA.find((t) => t.value === tipo)?.label ?? tipo;
}

// Somente mangas e light novels tem capitulos para leitura online; livros sao vendidos fechados.
export function tipoTemCapitulos(tipo) {
  return tipo === 'manga' || tipo === 'novel';
}

// Volume so faz sentido para obras seriadas.
export function tipoTemVolume(tipo) {
  return tipo === 'manga' || tipo === 'novel';
}

export const ORDENACOES = [
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'mais-vendidos', label: 'Mais vendidos' },
  { value: 'nome', label: 'Nome (A-Z)' },
  { value: 'preco-asc', label: 'Menor preço' },
  { value: 'preco-desc', label: 'Maior preço' },
];
