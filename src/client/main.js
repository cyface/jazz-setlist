import { mount } from 'svelte'
import App from './App.svelte'
import './app.css'
import { requestReload } from './lib/reload-guard.js'

mount(App, { target: document.getElementById('app') })

// The service worker (vite-plugin-pwa, autoUpdate) exists only in production builds.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // The page was loaded from the old worker's precache, so when a new release's worker takes over
  // (it skips waiting), reload once to run the new code. No controller yet means a first install: nothing to refresh.
  // The reload waits while the metronome is playing (lib/reload-guard.js).
  const updating = Boolean(navigator.serviceWorker.controller)
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!updating || reloading) return
    reloading = true
    requestReload()
  })

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      // An installed app can stay open for days: look for a new release whenever it comes back to the foreground.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {})
      })
    } catch (err) {
      console.warn('Service worker registration failed', err)
    }
  })
}
