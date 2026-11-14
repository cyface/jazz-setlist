import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests (e2e/*.spec.js), run with `pnpm test:e2e`. Two servers, each with a fresh local D1 and the fixed
 * test user (see vite.config.js), on their own ports, apart from `pnpm dev` and its data:
 * - `chromium`: the app flows, against `vite` (Worker + client in dev mode).
 * - `pwa`: the service worker, which exists only in production builds, against `vite preview` of `pnpm build`.
 */
const DEV_PORT = 5189
const PREVIEW_PORT = 5190
const freshDb = (dir) => `rm -rf ${dir} && pnpm exec wrangler d1 migrations apply jazz-setlist --local --persist-to ${dir}`
const env = { CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false' }

export default defineConfig({
  testDir: 'e2e',
  // One shared database per server: tests run one at a time and each cleans up what it made.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { trace: 'retain-on-failure' },
  globalTeardown: './e2e/teardown.js',
  projects: [
    {
      name: 'chromium',
      testIgnore: /pwa\.spec\.js/,
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${DEV_PORT}` },
    },
    {
      name: 'pwa',
      testMatch: /pwa\.spec\.js/,
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${PREVIEW_PORT}`, serviceWorkers: 'allow' },
    },
  ],
  webServer: [
    {
      command: `${freshDb('.wrangler/e2e')} && E2E=1 pnpm exec vite`,
      url: `http://localhost:${DEV_PORT}/api/me`,
      env,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: 'ignore',
    },
    {
      // A normal production build (E2E only at preview time, so nothing test-only is built in). The test user goes in
      // the build's .dev.vars, which only local preview reads.
      command: [
        'pnpm build',
        `printf 'DEV_AUTH_EMAIL=e2e@example.com\\n' > dist/jazz_setlist/.dev.vars`,
        freshDb('.wrangler/e2e-preview'),
        'E2E=1 E2E_STATE=.wrangler/e2e-preview pnpm exec vite preview',
      ].join(' && '),
      url: `http://localhost:${PREVIEW_PORT}/api/me`,
      env,
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'ignore',
    },
  ],
})
