import { describe, expect, it } from 'vitest'
import { findTune, forgetPositions, recallPosition, rememberPosition } from './setlist-position.js'

const tune = (key, arrangementId) => ({ key, arrangement: { id: arrangementId } })
const memory = () => {
  const data = new Map()
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    key: (i) => [...data.keys()][i] ?? null,
    get length() {
      return data.size
    },
  }
}

describe('findTune', () => {
  const tunes = [tune('k1', 'a'), tune('k2', 'b'), tune('k3', 'a')]

  it('finds the tune at the remembered index', () => {
    expect(findTune(tunes, { index: 2, arrangementId: 'a' }).key).toBe('k3')
  })

  it('falls back to the arrangement when the setlist was reordered', () => {
    expect(findTune(tunes, { index: 0, arrangementId: 'b' }).key).toBe('k2')
    expect(findTune(tunes, { index: 9, arrangementId: 'a' }).key).toBe('k1')
  })

  it('finds nothing for a removed tune or no position', () => {
    expect(findTune(tunes, { index: 1, arrangementId: 'gone' })).toBeNull()
    expect(findTune(tunes, null)).toBeNull()
  })
})

describe('remember and recall', () => {
  it('survives new item keys (the setlist was reloaded)', () => {
    const storage = memory()
    rememberPosition('s1', [tune('x1', 'a'), tune('x2', 'b')], 'x2', storage)
    expect(recallPosition('s1', [tune('y1', 'a'), tune('y2', 'b')], storage)).toBe('y2')
    expect(recallPosition('other', [tune('y1', 'a')], storage)).toBeNull()
  })

  it('copes with storage that is missing, throws or holds junk', () => {
    const throwing = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
    expect(() => rememberPosition('s1', [tune('x1', 'a')], 'x1', throwing)).not.toThrow()
    expect(recallPosition('s1', [tune('x1', 'a')], throwing)).toBeNull()
    expect(recallPosition('s1', [tune('x1', 'a')], undefined)).toBeNull()
    const junk = memory()
    junk.setItem('setlist-position:s1', '{not json')
    expect(recallPosition('s1', [tune('x1', 'a')], junk)).toBeNull()
  })
})

describe('forgetPositions', () => {
  it('forgets every setlist position and nothing else', () => {
    const storage = memory()
    const tunes = [tune('k1', 'a')]
    rememberPosition('s1', tunes, 'k1', storage)
    rememberPosition('s2', tunes, 'k1', storage)
    storage.setItem('theme', 'dark')
    forgetPositions(storage)
    expect(recallPosition('s1', tunes, storage)).toBeNull()
    expect(recallPosition('s2', tunes, storage)).toBeNull()
    expect(storage.getItem('theme')).toBe('dark')
  })

  it('works without storage', () => {
    const broken = {
      get length() {
        throw new Error('blocked')
      },
    }
    expect(() => forgetPositions(broken)).not.toThrow()
  })
})
