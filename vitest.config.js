import { playwright } from '@vitest/browser-playwright'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'
import { sharedConfig } from './vite.shared.js'

const BROWSER_TESTS = 'src/client/**/*.browser.test.js'

export default defineConfig({
  ...sharedConfig,
  // Compiles runes in *.svelte.js modules (e.g. lib/connection.svelte.js, imported by lib/api.js) and components.
  plugins: [svelte()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.{js,jsx}', 'scripts/**/*.test.js'],
          exclude: [BROWSER_TESTS],
        },
      },
      {
        // Svelte components rendered in a real Chromium (Playwright), driven through vitest-browser-svelte.
        extends: true,
        test: {
          name: 'browser',
          include: [BROWSER_TESTS],
          setupFiles: ['src/client/test/setup.js'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            screenshotFailures: false,
          },
        },
      },
    ],
  },
})
