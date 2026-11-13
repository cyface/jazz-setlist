import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { cloudflare } from '@cloudflare/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'
import { sharedConfig } from './vite.shared.js'

// PWA setup follows cyface-invoice, adapted for a Hono-rendered shell (no
// index.html): the shell links the manifest and src/client/main.js registers
// /sw.js. Icons are rendered from public/favicon.svg by `pnpm icons`.
const pwa = VitePWA({
  registerType: 'autoUpdate',
  injectRegister: false,
  // globPatterns already precaches every icon and favicon.
  includeManifestIcons: false,
  manifest: {
    name: 'Jazz Setlist',
    short_name: 'Setlist',
    description: 'Tune arrangements, show setlists, and a metronome for the drummer',
    theme_color: '#14110f',
    background_color: '#14110f',
    display: 'standalone',
    scope: '/',
    start_url: '/',
    icons: [
      { src: 'assets/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'assets/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: 'assets/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,png,svg,ico,woff2}'],
    // The shell loads /assets/app.js?v=<version>; match the precached file.
    ignoreURLParametersMatching: [/^v$/],
    cleanupOutdatedCaches: true,
    // The shell is server-rendered, so there is no index.html to fall back to.
    // Navigations go to the network first: an expired Access session then
    // redirects to the login instead of a cached shell whose API calls all
    // fail. The cached shell is used only when offline.
    navigateFallback: null,
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'shell',
          networkTimeoutSeconds: 4,
          cacheableResponse: { statuses: [200] },
        },
      },
    ],
  },
})

// Only the browser build gets a manifest and service worker, not the Worker.
for (const plugin of pwa) plugin.applyToEnvironment = (env) => env.name === 'client'

export default defineConfig({
  ...sharedConfig,
  plugins: [svelte(), cloudflare(), pwa],
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
