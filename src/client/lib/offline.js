/**
 * The saved copy used when the server can't be reached: the signed-in user (from /api/me) and every
 * active setlist with its items and full tune details. It lives in localStorage under one key and
 * belongs to one user: signing in as someone else replaces it, and logging out clears it.
 * Every function takes the storage, so tests can pass a fake; storage failures are swallowed
 * (private mode, quota, blocked site data) and just mean there's no saved copy.
 */
const KEY = 'offline-copy'

const empty = (me = null) => ({ me, setlists: {} })

export function readCopy(storage = globalThis.localStorage) {
  try {
    const copy = JSON.parse(storage.getItem(KEY))
    return copy?.me?.id && copy.setlists ? copy : empty()
  } catch {
    return empty()
  }
}

function write(copy, storage) {
  try {
    storage.setItem(KEY, JSON.stringify(copy))
  } catch {
    // No room or no storage: the app works online, just not offline.
  }
}

/** Saves /api/me's user. A different user than the saved one starts a fresh copy. */
export function saveMe(me, storage = globalThis.localStorage) {
  const copy = readCopy(storage)
  write(copy.me?.id === me.id ? { ...copy, me } : empty(me), storage)
}

/** Keeps saved preferences in step with the server's after they're saved. */
export function savePreferences(preferences, storage = globalThis.localStorage) {
  const copy = readCopy(storage)
  if (copy.me) write({ ...copy, me: { ...copy.me, preferences } }, storage)
}

/** Saves a full setlist (from GET/PUT /api/setlists/:id) if it's active, or drops it once archived. */
export function saveSetlist(setlist, storage = globalThis.localStorage) {
  const copy = readCopy(storage)
  if (!copy.me) return // no user yet: nothing to attach it to
  const setlists = { ...copy.setlists }
  if (setlist.archivedAt) delete setlists[setlist.id]
  else setlists[setlist.id] = { ...setlist, savedAt: new Date().toISOString() }
  write({ ...copy, setlists }, storage)
}

/** Keeps only the setlists that are still active (`activeIds`), e.g. after one was archived or deleted elsewhere. */
export function keepSetlists(activeIds, storage = globalThis.localStorage) {
  const copy = readCopy(storage)
  const keep = new Set(activeIds)
  write({ ...copy, setlists: Object.fromEntries(Object.entries(copy.setlists).filter(([id]) => keep.has(id))) }, storage)
}

export const forgetSetlist = (id, storage = globalThis.localStorage) => {
  const copy = readCopy(storage)
  if (!(id in copy.setlists)) return
  const { [id]: _gone, ...setlists } = copy.setlists
  write({ ...copy, setlists }, storage)
}

/** An edited tune replaces its copy inside saved setlists, so the metronome uses the new tempo offline. */
export function saveArrangement(arrangement, storage = globalThis.localStorage) {
  mapItems(storage, (item) => (item.arrangement?.id === arrangement.id ? { ...item, arrangement } : item))
}

/** A deleted tune leaves every setlist (the server cascades the same way). */
export function forgetArrangement(id, storage = globalThis.localStorage) {
  mapItems(storage, (item) => (item.arrangement?.id === id ? null : item))
}

function mapItems(storage, fn) {
  const copy = readCopy(storage)
  if (!Object.keys(copy.setlists).length) return
  const setlists = Object.fromEntries(
    Object.entries(copy.setlists).map(([id, s]) => [id, { ...s, items: s.items.map(fn).filter(Boolean) }]),
  )
  write({ ...copy, setlists }, storage)
}

export const savedSetlist = (id, storage = globalThis.localStorage) => readCopy(storage).setlists[id] ?? null

/** The saved setlists as GET /api/setlists rows (newest show first), for the lists offline. */
export function savedSetlistRows(storage = globalThis.localStorage) {
  return Object.values(readCopy(storage).setlists)
    .map(({ items, notes: _notes, savedAt: _savedAt, ...row }) => ({ ...row, tuneCount: items.filter((i) => i.kind === 'tune').length }))
    .sort((a, b) => (b.showDate ?? '').localeCompare(a.showDate ?? '') || (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
}

export function clearCopy(storage = globalThis.localStorage) {
  try {
    storage.removeItem(KEY)
  } catch {
    // Nothing saved, or no storage.
  }
}
