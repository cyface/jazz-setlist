import { connection } from './connection.svelte.js'
import * as offline from './offline.js'

/** The server couldn't be reached (no network, or an expired Access session redirecting to another origin). */
export class OfflineError extends Error {
  offline = true
}

/** Reads give up after this long and count as offline (venue wifi that connects but passes nothing).
    Writes don't time out: aborting one wouldn't undo it on the server. */
export const READ_TIMEOUT_MS = 8000

/** `body`: sent as JSON, or as it is when it's a FormData (a file upload; the browser sets its content type). */
async function request(method, path, body) {
  const form = body instanceof FormData
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined || form ? undefined : { 'content-type': 'application/json' },
      body: body === undefined || form ? body : JSON.stringify(body),
      signal: method === 'GET' ? AbortSignal.timeout(READ_TIMEOUT_MS) : undefined,
    })
  } catch {
    // An expired Cloudflare Access session redirects to the login page on
    // another origin, which fetch reports as a network error too.
    connection.offline = true
    throw new OfflineError('Could not reach the server. If your session expired, reload the page.')
  }
  connection.offline = false
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const detail = data?.issues?.map((i) => `${i.path}: ${i.message}`).join('; ')
    throw Object.assign(new Error(detail || data?.error || `${res.status} ${res.statusText}`), { status: res.status })
  }
  return res.status === 204 ? null : res.json()
}

/** On a network error, `saved()` (the offline copy) instead, if there is one. */
const orSaved = (promise, saved) =>
  promise.catch((err) => {
    const copy = err instanceof OfflineError ? saved() : null
    if (copy == null) throw err
    return copy
  })

/** Passes a response through after keeping the offline copy in step with it. */
const tap = (fn) => (value) => {
  fn(value)
  return value
}

const setlist = (promise) => promise.then((r) => r.setlist).then(tap(offline.saveSetlist))
/** A changed tune (its fields or its documents) also replaces its copy inside the saved setlists. */
const arrangement = (promise) => promise.then((r) => r.arrangement).then(tap(offline.saveArrangement))

function documentForm(file, type) {
  const form = new FormData()
  form.set('type', type)
  form.set('file', file)
  return form
}

export const api = {
  me: () =>
    orSaved(
      request('GET', '/me').then((r) => r.user).then(tap(offline.saveMe)),
      () => offline.readCopy().me,
    ),
  savePreferences: (preferences) =>
    request('PUT', '/me/preferences', preferences)
      .then((r) => r.preferences)
      .then(tap(offline.savePreferences)),

  listArrangements: () => request('GET', '/arrangements').then((r) => r.arrangements),
  getArrangement: (id) => request('GET', `/arrangements/${id}`).then((r) => r.arrangement),
  createArrangement: (data) => request('POST', '/arrangements', data).then((r) => r.arrangement),
  updateArrangement: (id, data) => arrangement(request('PUT', `/arrangements/${id}`, data)),
  deleteArrangement: (id) => request('DELETE', `/arrangements/${id}`).then(tap(() => offline.forgetArrangement(id))),

  // Documents attached to a tune. Each resolves to the tune with its documents as they are now.
  uploadDocument: (arrangementId, file, type) =>
    arrangement(request('POST', `/arrangements/${arrangementId}/documents`, documentForm(file, type))),
  updateDocument: (arrangementId, id, data) => arrangement(request('PUT', `/arrangements/${arrangementId}/documents/${id}`, data)),
  deleteDocument: (arrangementId, id) => arrangement(request('DELETE', `/arrangements/${arrangementId}/documents/${id}`)),

  listSetlists: (contains) =>
    contains
      ? request('GET', `/setlists?contains=${encodeURIComponent(contains)}`).then((r) => r.setlists)
      : orSaved(
          request('GET', '/setlists')
            .then((r) => r.setlists)
            .then(tap((rows) => offline.keepSetlists(rows.filter((s) => !s.archivedAt).map((s) => s.id)))),
          () => offline.savedSetlistRows(),
        ),
  getSetlist: (id) => orSaved(setlist(request('GET', `/setlists/${id}`)), () => offline.savedSetlist(id)),
  createSetlist: (data) => setlist(request('POST', '/setlists', data)),
  updateSetlist: (id, data) => setlist(request('PUT', `/setlists/${id}`, data)),
  setSetlistArchived: (id, archived) => setlist(request('PUT', `/setlists/${id}/archived`, { archived })),
  addTuneToSetlist: (id, arrangementId) => setlist(request('POST', `/setlists/${id}/items`, { arrangementId })),
  saveSetlistItems: (id, items) => setlist(request('PUT', `/setlists/${id}/items`, { items })),
  deleteSetlist: (id) => request('DELETE', `/setlists/${id}`).then(tap(() => offline.forgetSetlist(id))),
}

/** Saves every active setlist for offline use: in the background once the app has loaded, and again when it
    comes back to the foreground or online (an installed app can stay open for days). */
export async function saveActiveSetlistsOffline() {
  const rows = await api.listSetlists()
  if (connection.offline) return // those rows came from the saved copy
  await Promise.all(rows.filter((s) => !s.archivedAt).map((s) => api.getSetlist(s.id)))
}
