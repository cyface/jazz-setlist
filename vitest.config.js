import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'
import { sharedConfig } from './vite.shared.js'

export default defineConfig({
  ...sharedConfig,
  // Compiles runes in *.svelte.js modules (e.g. lib/connection.svelte.js, imported by lib/api.js).
  plugins: [svelte()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}', 'scripts/**/*.test.js'],
  },
})
