import fs from 'node:fs';
import path from 'node:path';
import { request } from '@playwright/test';
import { ADMIN_STATE, BASE_URL, COVERS_DIR } from './env.js';

// Identificador unico por execucao: os dados criados pelos testes nao colidem entre rodadas.
export const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const uniq = (label) => `E2E ${label} ${RUN_ID}${Math.random().toString(36).slice(2, 6)}`;

export function coverFiles() {
  return fs
    .readdirSync(COVERS_DIR)
    .filter((f) => f.endsWith('.jpg'))
    .sort()
    .map((f) => path.join(COVERS_DIR, f));
}

export function coverFile(index = 0) {
  const files = coverFiles();
  return files[index % files.length];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Repete a chamada enquanto o backend responder 429 (throttle de login/cadastro: 5/min por IP). */
export async function withThrottleRetry(fn, { tries = 9, waitMs = 10_000 } = {}) {
  for (let i = 0; ; i += 1) {
    const res = await fn();
    if (res.status() !== 429 || i >= tries) return res;
    await sleep(waitMs);
  }
}

/** Contexto HTTP autenticado como admin (cookie salvo pelo global-setup). */
export function adminApi() {
  return request.newContext({ baseURL: BASE_URL, ignoreHTTPSErrors: true, storageState: ADMIN_STATE });
}

async function ok(res, what) {
  if (!res.ok()) throw new Error(`${what}: HTTP ${res.status()} ${await res.text()}`);
  return res.status() === 204 ? null : res.json();
}

export async function criarObra(api, { tipo, nome, preco = 19.9, volume, autor = 'Autor E2E', capa = true, descricao }) {
  const multipart = { tipo, nome, preco: String(preco), autor, descricao: descricao ?? `Obra de teste (${tipo}).` };
  if (volume) multipart.volume = String(volume);
  if (capa) {
    const buffer = fs.readFileSync(coverFile(Math.floor(Math.random() * 20)));
    multipart.capa = { name: 'capa.jpg', mimeType: 'image/jpeg', buffer };
  }
  return ok(await api.post('/api/obras', { multipart }), `criar obra ${nome}`);
}

export async function criarCapituloComPaginas(api, obraId, { numero = 1, titulo = null, paginas = 2 } = {}) {
  const cap = await ok(await api.post(`/api/obras/${obraId}/capitulos`, { data: { numero, titulo } }), 'criar capitulo');
  for (let i = 0; i < paginas; i += 1) {
    const buffer = fs.readFileSync(coverFile(i + 3));
    await ok(
      await api.post(`/api/capitulos/${cap.id}/paginas`, {
        multipart: { imagem: { name: `p${i + 1}.jpg`, mimeType: 'image/jpeg', buffer } },
      }),
      'enviar pagina',
    );
  }
  return cap;
}

export async function excluirObra(api, id) {
  const res = await api.delete(`/api/obras/${id}`);
  if (![204, 404].includes(res.status())) throw new Error(`excluir obra ${id}: HTTP ${res.status()}`);
}

/** Limpeza de seguranca: remove obras de teste cujo nome contem o termo. */
export async function excluirObrasPorBusca(api, busca) {
  const res = await api.get('/api/obras', { params: { busca, limit: 50 } });
  if (!res.ok()) return;
  const { data } = await res.json();
  for (const obra of data.filter((o) => o.nome.includes(busca))) await excluirObra(api, obra.id);
}

/** Gera um CPF valido (digitos verificadores corretos). */
export function gerarCpf() {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  if (n.every((d) => d === n[0])) n[0] = (n[0] + 1) % 10;
  const dv = (base) => {
    const soma = base.reduce((acc, d, i) => acc + d * (base.length + 1 - i), 0);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  n.push(dv(n));
  n.push(dv(n));
  return n.join('');
}
