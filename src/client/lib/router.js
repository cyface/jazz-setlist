const ID = /^[\w-]+$/
const INDEX = /^\d+$/

/** `?setlist=<id>&tune=<index>` on the tune form: it was opened from that tune in that setlist. */
const fromSetlist = (q) =>
  ID.test(q.get('setlist') ?? '') && INDEX.test(q.get('tune') ?? '') ? { from: { setlistId: q.get('setlist'), index: Number(q.get('tune')) } } : {}

/** `?tune=<index>&arrangement=<id>` on a setlist: open that tune (index among the tunes, as in lib/setlist-position.js). */
const openTune = (q) =>
  INDEX.test(q.get('tune') ?? '') && ID.test(q.get('arrangement') ?? '')
    ? { open: { index: Number(q.get('tune')), arrangementId: q.get('arrangement') } }
    : {}

const ROUTES = [
  [/^\/$/, () => ({ name: 'arrangements', id: null })],
  [/^\/arrangements\/new$/, () => ({ name: 'arrangement-edit', id: null })],
  [/^\/arrangements\/([\w-]+)\/edit$/, (m, q) => ({ name: 'arrangement-edit', id: m[1], ...fromSetlist(q) })],
  [/^\/arrangements\/([\w-]+)$/, (m) => ({ name: 'arrangements', id: m[1] })],
  [/^\/setlists$/, () => ({ name: 'setlists', archived: false })],
  [/^\/setlists\/archived$/, () => ({ name: 'setlists', archived: true })],
  [/^\/setlists\/([\w-]+)$/, (m, q) => ({ name: 'setlist', id: m[1], ...openTune(q) })],
  [/^\/preferences$/, () => ({ name: 'preferences' })],
]

export function matchRoute(hash) {
  const [path, query = ''] = (hash.replace(/^#/, '') || '/').split('?')
  const params = new URLSearchParams(query)
  for (const [pattern, build] of ROUTES) {
    const m = path.match(pattern)
    if (m) return build(m, params)
  }
  return { name: 'not-found' }
}

/** The hash without its `?…` part: the page itself, not what it was asked to open. */
export const withoutQuery = (hash) => hash.split('?')[0]

/** The tune form's link; `from` ({ setlistId, index }) when the tune was opened in a setlist. */
export const editTuneHref = (arrangementId, from = null) =>
  `#/arrangements/${arrangementId}/edit${from ? `?setlist=${from.setlistId}&tune=${from.index}` : ''}`

/** Where the tune form goes on Save or Cancel: back to that tune in the setlist it was opened from, else the tune. */
export const afterEditPath = (arrangementId, from = null) =>
  from ? `/setlists/${from.setlistId}?tune=${from.index}&arrangement=${arrangementId}` : `/arrangements/${arrangementId}`

export const navigate = (path) => {
  location.hash = path
}
