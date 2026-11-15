import fs from 'node:fs/promises';
import { request } from '@playwright/test';
import { ADMIN_STATE, AUTH_DIR, BASE_URL, CUSTOMER_FILE, CUSTOMER_STATE, adminCredentials } from './support/env.js';
import { gerarCpf, withThrottleRetry } from './support/data.js';

async function login(email, senha, statePath) {
  const ctx = await request.newContext({ baseURL: BASE_URL, ignoreHTTPSErrors: true });
  const res = await withThrottleRetry(() => ctx.post('/api/auth/login', { data: { email, senha } }));
  if (!res.ok()) throw new Error(`login ${email}: HTTP ${res.status()} ${await res.text()}`);
  await ctx.storageState({ path: statePath });
  await ctx.dispose();
}

// Sessoes reutilizaveis pelos testes: admin (credenciais do ambiente) e um cliente novo por execucao.
export default async function globalSetup() {
  await fs.mkdir(AUTH_DIR, { recursive: true });
  const admin = adminCredentials();
  await login(admin.email, admin.senha, ADMIN_STATE);

  const sufixo = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const cliente = {
    nome: `Cliente E2E ${sufixo}`,
    email: `e2e.${sufixo}@kumoko.test`,
    cpf: gerarCpf(),
    senha: 'Leitor2026e2e',
  };
  const ctx = await request.newContext({ baseURL: BASE_URL, ignoreHTTPSErrors: true });
  const res = await withThrottleRetry(() => ctx.post('/api/auth/register', { data: cliente }));
  if (res.status() !== 201) throw new Error(`cadastro do cliente E2E: HTTP ${res.status()} ${await res.text()}`);
  await ctx.dispose();
  await login(cliente.email, cliente.senha, CUSTOMER_STATE);
  await fs.writeFile(CUSTOMER_FILE, JSON.stringify(cliente, null, 2));
}
