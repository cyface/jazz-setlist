import { describe, expect, it } from 'vitest'
import { forgetRoute, rememberRoute, startRoute } from './last-route.js'

const memory = () => {
  const data = new Map()
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), removeItem: (k) => data.delete(k) }
}
const broken = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
  removeItem: () => {
    throw new Error('blocked')
  },
}

describe('last route', () => {
  it('reopens the remembered page when the app starts without a route', () => {
    const storage = memory()
    rememberRoute('#/setlists/abc', 'u1', storage)
    expect(startRoute('', 'u1', storage)).toBe('#/setlists/abc')
    expect(startRoute('#', 'u1', storage)).toBe('#/setlists/abc')
  })

  it('keeps a route given in the URL', () => {
    const storage = memory()
    rememberRoute('#/setlists/abc', 'u1', storage)
    expect(startRoute('#/', 'u1', storage)).toBeNull()
    expect(startRoute('#/preferences', 'u1', storage)).toBeNull()
  })

  it('remembers the Tunes page for an empty hash', () => {
    const storage = memory()
    rememberRoute('#/setlists/abc', 'u1', storage)
    rememberRoute('', 'u1', storage)
    expect(startRoute('', 'u1', storage)).toBe('#/')
  })

  it('does not remember forms or unknown pages', () => {
    const storage = memory()
    rememberRoute('#/setlists', 'u1', storage)
    rememberRoute('#/arrangements/new', 'u1', storage)
    rememberRoute('#/arrangements/x/edit', 'u1', storage)
    rememberRoute('#/nope', 'u1', storage)
    expect(startRoute('', 'u1', storage)).toBe('#/setlists')
  })

  it('ignores a stored value that is not a page', () => {
    const storage = memory()
    storage.setItem('last-route', JSON.stringify({ userId: 'u1', hash: '#/arrangements/new' }))
    expect(startRoute('', 'u1', storage)).toBeNull()
    storage.setItem('last-route', '#/setlists') // not JSON
    expect(startRoute('', 'u1', storage)).toBeNull()
  })

  it('belongs to the user who was on it', () => {
    const storage = memory()
    rememberRoute('#/setlists/abc', 'u1', storage)
    expect(startRoute('', 'u2', storage)).toBeNull()
    rememberRoute('#/setlists', null, storage) // before the session loads: not remembered
    expect(startRoute('', 'u1', storage)).toBe('#/setlists/abc')
  })

  it('forgets the route', () => {
    const storage = memory()
    rememberRoute('#/setlists', 'u1', storage)
    forgetRoute(storage)
    expect(startRoute('', 'u1', storage)).toBeNull()
  })

  it('works without storage', () => {
    expect(() => rememberRoute('#/setlists', 'u1', broken)).not.toThrow()
    expect(startRoute('', 'u1', broken)).toBeNull()
    expect(() => forgetRoute(broken)).not.toThrow()
  })
})
