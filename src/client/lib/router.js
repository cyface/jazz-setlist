const ROUTES = [
  [/^\/$/, () => ({ name: 'arrangements', id: null })],
  [/^\/arrangements\/new$/, () => ({ name: 'arrangement-edit', id: null })],
  [/^\/arrangements\/([\w-]+)\/edit$/, (m) => ({ name: 'arrangement-edit', id: m[1] })],
  [/^\/arrangements\/([\w-]+)$/, (m) => ({ name: 'arrangements', id: m[1] })],
  [/^\/setlists$/, () => ({ name: 'setlists' })],
  [/^\/setlists\/([\w-]+)$/, (m) => ({ name: 'setlist', id: m[1] })],
]

export function matchRoute(hash) {
  const path = hash.replace(/^#/, '') || '/'
  for (const [pattern, build] of ROUTES) {
    const m = path.match(pattern)
    if (m) return build(m)
  }
  return { name: 'not-found' }
}

export const navigate = (path) => {
  location.hash = path
}
