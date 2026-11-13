import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { cloudflare } from '@cloudflare/vite-plugin'
import { sharedConfig } from './vite.shared.js'

export default defineConfig({
  ...sharedConfig,
  plugins: [svelte(), cloudflare()],
  environments: {
    client: {
      build: {
        rollupOptions: {
          input: { app: 'src/client/main.js' },
          output: {
            entryFileNames: 'assets/[name].js',
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name][extname]',
          },
        },
      },
    },
  },
  server: { port: 5188, strictPort: true },
})
