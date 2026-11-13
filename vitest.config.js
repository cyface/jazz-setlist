import { defineConfig } from 'vitest/config'
import { sharedConfig } from './vite.shared.js'

export default defineConfig({
  ...sharedConfig,
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}', 'scripts/**/*.test.js'],
  },
})
