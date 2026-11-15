import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const BASE_URL = process.env.E2E_BASE_URL ?? 'https://localhost:8443';
export const AUTH_DIR = path.resolve(here, '../.auth');
export const ADMIN_STATE = path.join(AUTH_DIR, 'admin.json');
export const CUSTOMER_STATE = path.join(AUTH_DIR, 'customer.json');
export const CUSTOMER_FILE = path.join(AUTH_DIR, 'customer-credentials.json');
export const COVERS_DIR = path.resolve(here, '../../../backend/apps/catalog-service/seed/covers');

// Credenciais do admin: E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD, ADMIN_EMAIL/ADMIN_PASSWORD ou o .env da raiz.
export function adminCredentials() {
  let email = process.env.E2E_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL;
  let senha = process.env.E2E_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD;
  if (!email || !senha) {
    let env = '';
    try {
      env = fs.readFileSync(path.resolve(here, '../../../.env'), 'utf8');
    } catch {
      // sem .env: depende das variaveis de ambiente
    }
    const read = (key) => env.split(/\r?\n/).find((l) => l.startsWith(`${key}=`))?.slice(key.length + 1).trim();
    email ??= read('ADMIN_EMAIL');
    senha ??= read('ADMIN_PASSWORD');
  }
  if (!email || !senha) throw new Error('Defina E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD ou o .env da raiz.');
  return { email, senha };
}

export function customerCredentials() {
  return JSON.parse(fs.readFileSync(CUSTOMER_FILE, 'utf8'));
}
