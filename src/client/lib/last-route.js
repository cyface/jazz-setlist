import { matchRoute } from './router.js'

/**
 * Remembers the page you were on (localStorage), so opening the app again without a route
 * (the installed app's start URL, or typing the domain) goes back there: e.g. the setlist at a gig.
 * Forms aren't remembered, since their unsaved input is gone anyway.
 */
const KEY = 'last-route'
const REMEMBERED = new Set(['arrangements', 'setlists', 'setlist', 'preferences'])

export function rememberRoute(hash, storage = globalThis.localStorage) {
  if (!REMEMBERED.has(matchRoute(hash).name)) return
  try {
    storage.setItem(KEY, hash || '#/')
  } catch {
    // No storage: the app opens on the Tunes page as before.
  }
}

/** The hash to open with: the remembered one when the app was opened without a route, else null (keep the URL's). */
export function startRoute(hash, storage = globalThis.localStorage) {
  if (hash && hash !== '#') return null
  try {
    const saved = storage.getItem(KEY)
    return saved && REMEMBERED.has(matchRoute(saved).name) ? saved : null
  } catch {
    return null
  }
}

export function forgetRoute(storage = globalThis.localStorage) {
  try {
    storage.removeItem(KEY)
  } catch {
    // Nothing to forget.
  }
}
