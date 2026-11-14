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
    // A new release's worker takes over open pages at once (main.js then reloads them once, held while the
    // metronome plays), and a first install controls the page without a reload, so it works offline right away.
    // The plugin sets these for autoUpdate only when it injects the registration; main.js registers /sw.js itself.
    skipWaiting: true,
    clientsClaim: true,
    globPatterns: ['**/*.{js,css,png,svg,ico,woff2}'],
    // The shell loads /assets/app.js?v=<version>; match the precached file.
    ignoreURLParametersMatching: [/^v$/],
    // vite-plugin-pwa assumes every file in assets/ has a content hash in its
    // name and precaches it without a revision. app.js and app.css keep fixed
    // names, so they need revisions: without them sw.js never changes between
    // releases and the old app.js is served forever. Only hashed chunks
    // ([name]-[hash].js) skip the revision. scripts/check-sw.js checks the build.
    dontCacheBustURLsMatching: /-[\w-]{8}\.\w+$/,
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

// End-to-end runs (Playwright, e2e/) set E2E=1: their own local D1 (E2E_STATE, default .wrangler/e2e) and a fixed
// test user, on other ports, so they never touch your dev data or a running `pnpm dev`. (.env is not loaded for them:
// playwright.config.js sets CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV=false.) The service worker tests preview a normal
// production build; their test user comes from dist/jazz_setlist/.dev.vars (local preview only, never deployed).
// Never for a build: the test user would land in the deploy config's vars (scripts/check-deploy-config.js checks).
const e2e = process.env.E2E === '1'
const E2E_PORT = 5189
const E2E_PREVIEW_PORT = 5190
const E2E_USER = 'e2e@example.com'
const cloudflareOptions = e2e
  ? { persistState: { path: process.env.E2E_STATE ?? '.wrangler/e2e' }, config: { vars: { DEV_AUTH_EMAIL: E2E_USER } } }
  : {}

// Only the browser build gets a manifest and service worker, not the Worker.
for (const plugin of pwa) plugin.applyToEnvironment = (env) => env.name === 'client'

export default defineConfig(({ command }) => {
  if (e2e && command === 'build') throw new Error('E2E=1 is for the e2e servers only; unset it to build.')
  return {
    ...sharedConfig,
    plugins: [svelte(), cloudflare(cloudflareOptions), pwa],
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
    server: { port: e2e ? E2E_PORT : 5188, strictPort: true },
    preview: e2e ? { port: E2E_PREVIEW_PORT, strictPort: true } : undefined,
  }
})
