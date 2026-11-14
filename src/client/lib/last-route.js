import { matchRoute, withoutQuery } from './router.js'

/**
 * Remembers the page you were on (localStorage), so opening the app again without a route
 * (the installed app's start URL, or typing the domain) goes back there: e.g. the setlist at a gig.
 * It belongs to the user who was on it: someone else signing in on this browser starts on the Tunes page.
 * Forms aren't remembered, since their unsaved input is gone anyway, nor a `?…` asking a page to open something
 * (the tune a setlist reopens after editing it): that was a one-off.
 */
const KEY = 'last-route'
const REMEMBERED = new Set(['arrangements', 'setlists', 'setlist', 'preferences'])

export function rememberRoute(hash, userId, storage = globalThis.localStorage) {
  if (!userId || !REMEMBERED.has(matchRoute(hash).name)) return
  try {
    storage.setItem(KEY, JSON.stringify({ userId, hash: withoutQuery(hash) || '#/' }))
  } catch {
    // No storage: the app opens on the Tunes page as before.
  }
}

/** The hash to open with: this user's remembered one when the app was opened without a route, else null (keep the URL's). */
export function startRoute(hash, userId, storage = globalThis.localStorage) {
  if (hash && hash !== '#') return null
  try {
    const saved = JSON.parse(storage.getItem(KEY))
    return saved?.userId === userId && typeof saved.hash === 'string' && REMEMBERED.has(matchRoute(saved.hash).name) ? saved.hash : null
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
