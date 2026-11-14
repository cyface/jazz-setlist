import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests (e2e/*.spec.js) against `vite` with the Worker and a local D1, like `pnpm dev`, but on its own
 * port with a fresh database under .wrangler/e2e and a fixed test user (see vite.config.js). Run with `pnpm test:e2e`.
 */
const PORT = 5189

export default defineConfig({
  testDir: 'e2e',
  // One shared database: tests run one at a time and each cleans up what it made.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // A fresh database with every migration applied, then the dev server.
    command: `rm -rf .wrangler/e2e && pnpm exec wrangler d1 migrations apply jazz-setlist --local --persist-to .wrangler/e2e && pnpm exec vite`,
    url: `http://localhost:${PORT}/api/me`,
    env: { E2E: '1', CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false' },
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'ignore',
  },
})
