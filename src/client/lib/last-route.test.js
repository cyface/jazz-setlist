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
    rememberRoute('#/setlists/abc', storage)
    expect(startRoute('', storage)).toBe('#/setlists/abc')
    expect(startRoute('#', storage)).toBe('#/setlists/abc')
  })

  it('keeps a route given in the URL', () => {
    const storage = memory()
    rememberRoute('#/setlists/abc', storage)
    expect(startRoute('#/', storage)).toBeNull()
    expect(startRoute('#/preferences', storage)).toBeNull()
  })

  it('remembers the Tunes page for an empty hash', () => {
    const storage = memory()
    rememberRoute('#/setlists/abc', storage)
    rememberRoute('', storage)
    expect(startRoute('', storage)).toBe('#/')
  })

  it('does not remember forms or unknown pages', () => {
    const storage = memory()
    rememberRoute('#/setlists', storage)
    rememberRoute('#/arrangements/new', storage)
    rememberRoute('#/arrangements/x/edit', storage)
    rememberRoute('#/nope', storage)
    expect(startRoute('', storage)).toBe('#/setlists')
  })

  it('ignores a stored value that is not a page', () => {
    const storage = memory()
    storage.setItem('last-route', '#/arrangements/new')
    expect(startRoute('', storage)).toBeNull()
  })

  it('forgets the route', () => {
    const storage = memory()
    rememberRoute('#/setlists', storage)
    forgetRoute(storage)
    expect(startRoute('', storage)).toBeNull()
  })

  it('works without storage', () => {
    expect(() => rememberRoute('#/setlists', broken)).not.toThrow()
    expect(startRoute('', broken)).toBeNull()
    expect(() => forgetRoute(broken)).not.toThrow()
  })
})
