import { defineConfig, devices } from '@playwright/test';

// E2E contra a stack completa (gateway HTTPS).
// Local: usa o Chrome instalado (channel "chrome"), sem baixar navegador.
// CI: E2E_BROWSER_CHANNEL=chromium usa o Chromium baixado por `npx playwright install chromium`.
const baseURL = process.env.E2E_BASE_URL ?? 'https://localhost:8443';
const channel = process.env.E2E_BROWSER_CHANNEL ?? 'chrome';
const browser = channel === 'chromium' ? {} : { channel };

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.js',
  // Um worker: login/cadastro tem throttle de 5/min por IP e o acervo e compartilhado.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    locale: 'pt-BR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-1366',
      use: { ...devices['Desktop Chrome'], ...browser, viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'desktop-1920',
      use: { ...devices['Desktop Chrome'], ...browser, viewport: { width: 1920, height: 1080 } },
    },
  ],
});
