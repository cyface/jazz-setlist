/**
 * Remembers the last tune opened in each setlist (for this browser session),
 * so the setlist can highlight it when you come back to the list.
 * Item ids change when a setlist is saved, so the position is kept as the
 * tune's index plus its arrangement id.
 */
const storageKey = (setlistId) => `setlist-position:${setlistId}`

/** The tune `position` points at: the same index if it still holds that arrangement, else that arrangement's first appearance. */
export function findTune(tunes, position) {
  if (!position) return null
  const atIndex = tunes[position.index]
  if (atIndex?.arrangement?.id === position.arrangementId) return atIndex
  return tunes.find((t) => t.arrangement?.id === position.arrangementId) ?? null
}

export function rememberPosition(setlistId, tunes, key, storage = globalThis.sessionStorage) {
  const index = tunes.findIndex((t) => t.key === key)
  if (index < 0) return
  try {
    storage.setItem(storageKey(setlistId), JSON.stringify({ index, arrangementId: tunes[index].arrangement.id }))
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the highlight just won't survive leaving the page.
  }
}

/** The key of the remembered tune in `tunes`, or null. */
export function recallPosition(setlistId, tunes, storage = globalThis.sessionStorage) {
  try {
    return findTune(tunes, JSON.parse(storage.getItem(storageKey(setlistId))))?.key ?? null
  } catch {
    return null
  }
}
