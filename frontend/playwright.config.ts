import { defineConfig, devices } from '@playwright/test';

/**
 * E2E da Barbearia Luck.
 *
 * Roda nos dois extremos de viewport de propósito: a armadilha recorrente
 * deste workspace é funcionalidade que existe numa visão e não na outra.
 * Todo fluxo aqui é executado tanto em celular quanto em desktop.
 *
 * Pré-requisitos:
 *   docker compose up -d
 *   cd backend && npx prisma migrate deploy && npx prisma db seed && npm run start:dev
 *   cd frontend && npx playwright install && npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'celular', use: { ...devices['Pixel 7'] } },
    { name: 'tablet', use: { ...devices['iPad (gen 7)'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
