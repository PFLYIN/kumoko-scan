// Progresso de leitura por obra, salvo no navegador (localStorage).
// Vale para visitante e cliente logado; nao sincroniza entre dispositivos.
const STORAGE_KEY = 'kumoko:leitura:v1';
const PREFS_KEY = 'kumoko:leitor-prefs:v1';
const MAX_OBRAS = 30;

const listeners = new Set();
let cache = null;

function lerStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function gravarStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Modo privado ou cota cheia: o progresso apenas nao persiste.
  }
}

function snapshot() {
  if (cache === null) {
    const dados = lerStorage(STORAGE_KEY, {});
    cache = dados && typeof dados === 'object' && !Array.isArray(dados) ? dados : {};
  }
  return cache;
}

function emitir() {
  listeners.forEach((fn) => fn());
}

// Outra aba alterou o progresso: recarrega.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      emitir();
    }
  });
}

export const leituraStore = {
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getSnapshot: snapshot,
};

// Registro: { obraId, nome, tipo, capaThumbUrl, capituloId, capituloNumero, pagina, totalPaginas, atualizadoEm }
export function salvarProgresso(registro) {
  const atual = snapshot();
  const anterior = atual[registro.obraId];
  if (
    anterior &&
    anterior.capituloId === registro.capituloId &&
    anterior.pagina === registro.pagina &&
    anterior.totalPaginas === registro.totalPaginas
  ) {
    return;
  }
  const proximo = { ...atual, [registro.obraId]: { ...registro, atualizadoEm: Date.now() } };
  // Mantem so as obras lidas mais recentemente.
  const ordenadas = Object.values(proximo).sort((a, b) => b.atualizadoEm - a.atualizadoEm).slice(0, MAX_OBRAS);
  cache = Object.fromEntries(ordenadas.map((r) => [r.obraId, r]));
  gravarStorage(STORAGE_KEY, cache);
  emitir();
}

export function removerProgresso(obraId) {
  const atual = snapshot();
  if (!atual[obraId]) return;
  const { [obraId]: _removido, ...resto } = atual;
  cache = resto;
  gravarStorage(STORAGE_KEY, cache);
  emitir();
}

export function listarProgresso(dados) {
  return Object.values(dados).sort((a, b) => b.atualizadoEm - a.atualizadoEm);
}

// Preferencias do leitor (modo e largura).
export const MODOS_LEITURA = [
  { value: 'vertical', label: 'Rolagem contínua' },
  { value: 'paginado', label: 'Página a página' },
];

export const LARGURAS_LEITOR = [
  { value: 'estreita', label: 'Estreita', className: 'max-w-2xl' },
  { value: 'media', label: 'Média', className: 'max-w-3xl' },
  { value: 'larga', label: 'Larga', className: 'max-w-5xl' },
];

const PREFS_PADRAO = { modo: 'vertical', largura: 'media' };

export function lerPreferenciasLeitor() {
  const prefs = { ...PREFS_PADRAO, ...lerStorage(PREFS_KEY, {}) };
  if (!MODOS_LEITURA.some((m) => m.value === prefs.modo)) prefs.modo = PREFS_PADRAO.modo;
  if (!LARGURAS_LEITOR.some((l) => l.value === prefs.largura)) prefs.largura = PREFS_PADRAO.largura;
  return prefs;
}

export function salvarPreferenciasLeitor(prefs) {
  gravarStorage(PREFS_KEY, prefs);
}
