import { describe, expect, it } from 'vitest'
import {
  clearCopy,
  forgetArrangement,
  forgetSetlist,
  keepSetlists,
  readCopy,
  saveArrangement,
  saveMe,
  savePreferences,
  saveSetlist,
  savedSetlist,
  savedSetlistRows,
} from './offline.js'

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
const blocked = () => {
  throw new Error('blocked')
}
const broken = { getItem: blocked, setItem: blocked, removeItem: blocked }

const me = (id = 'u1') => ({ id, email: `${id}@example.com`, preferences: { sound: true } })
const tune = (id, extra = {}) => ({ kind: 'tune', label: '', arrangement: { id, title: `Tune ${id}`, tempo: 120, ...extra } })
const setlist = (id, items = [tune('a'), { kind: 'break', label: '20 min', arrangement: null }, tune('b')], extra = {}) => ({
  id,
  name: `Gig ${id}`,
  showDate: '2026-11-14',
  venue: null,
  notes: 'Bring brushes',
  archivedAt: null,
  updatedAt: '2026-11-14T10:00:00Z',
  items,
  ...extra,
})

describe('offline copy', () => {
  it('keeps an active setlist with its items and tune details', () => {
    const storage = memory()
    saveMe(me(), storage)
    saveSetlist(setlist('s1'), storage)
    const saved = savedSetlist('s1', storage)
    expect(saved.items).toHaveLength(3)
    expect(saved.items[0].arrangement.tempo).toBe(120)
    expect(saved.savedAt).toMatch(/^\d{4}-/)
  })

  it('saves nothing before a user is known', () => {
    const storage = memory()
    saveSetlist(setlist('s1'), storage)
    expect(savedSetlist('s1', storage)).toBeNull()
  })

  it('drops a setlist once it is archived or deleted', () => {
    const storage = memory()
    saveMe(me(), storage)
    saveSetlist(setlist('s1'), storage)
    saveSetlist(setlist('s2'), storage)
    saveSetlist(setlist('s1', undefined, { archivedAt: '2026-11-15T00:00:00Z' }), storage)
    forgetSetlist('s2', storage)
    expect(savedSetlist('s1', storage)).toBeNull()
    expect(savedSetlist('s2', storage)).toBeNull()
  })

  it('keeps only the setlists that are still active', () => {
    const storage = memory()
    saveMe(me(), storage)
    saveSetlist(setlist('s1'), storage)
    saveSetlist(setlist('s2'), storage)
    keepSetlists(['s2'], storage)
    expect(Object.keys(readCopy(storage).setlists)).toEqual(['s2'])
  })

  it('starts over for a different user, and keeps the copy for the same one', () => {
    const storage = memory()
    saveMe(me('u1'), storage)
    saveSetlist(setlist('s1'), storage)
    saveMe(me('u1'), storage)
    expect(savedSetlist('s1', storage)).not.toBeNull()
    storage.setItem('setlist-position:s1', '{"index":0,"arrangementId":"a"}')
    storage.setItem('theme', 'dark')
    saveMe(me('u2'), storage)
    expect(readCopy(storage).me.id).toBe('u2')
    expect(savedSetlist('s1', storage)).toBeNull()
    expect(storage.getItem('setlist-position:s1')).toBeNull() // the last user's tune positions go too
    expect(storage.getItem('theme')).toBe('dark') // the device's own settings stay
  })

  it('updates saved preferences', () => {
    const storage = memory()
    saveMe(me(), storage)
    savePreferences({ sound: false }, storage)
    expect(readCopy(storage).me.preferences).toEqual({ sound: false })
  })

  it('applies an edited tune to every saved setlist, and removes a deleted one', () => {
    const storage = memory()
    saveMe(me(), storage)
    saveSetlist(setlist('s1'), storage)
    saveSetlist(setlist('s2', [tune('a')]), storage)
    saveArrangement({ id: 'a', title: 'Tune a', tempo: 200 }, storage)
    expect(savedSetlist('s1', storage).items[0].arrangement.tempo).toBe(200)
    expect(savedSetlist('s2', storage).items[0].arrangement.tempo).toBe(200)
    forgetArrangement('a', storage)
    expect(savedSetlist('s1', storage).items.map((i) => i.kind)).toEqual(['break', 'tune'])
    expect(savedSetlist('s2', storage).items).toEqual([])
  })

  it('lists saved setlists like GET /api/setlists, newest show first', () => {
    const storage = memory()
    saveMe(me(), storage)
    saveSetlist(setlist('old', undefined, { showDate: '2026-01-01' }), storage)
    saveSetlist(setlist('new', [tune('a')], { showDate: '2026-12-01' }), storage)
    const rows = savedSetlistRows(storage)
    expect(rows.map((r) => r.id)).toEqual(['new', 'old'])
    expect(rows[0]).toEqual({
      id: 'new',
      name: 'Gig new',
      showDate: '2026-12-01',
      venue: null,
      archivedAt: null,
      updatedAt: '2026-11-14T10:00:00Z',
      tuneCount: 1,
    })
    expect(rows[1].tuneCount).toBe(2)
  })

  it('clears everything (log out)', () => {
    const storage = memory()
    saveMe(me(), storage)
    saveSetlist(setlist('s1'), storage)
    clearCopy(storage)
    expect(readCopy(storage)).toEqual({ me: null, setlists: {} })
  })

  it('treats unreadable or malformed storage as no copy', () => {
    const storage = memory()
    storage.setItem('offline-copy', '{not json')
    expect(readCopy(storage).me).toBeNull()
    storage.setItem('offline-copy', JSON.stringify({ setlists: {} }))
    expect(readCopy(storage).me).toBeNull()
    expect(readCopy(broken)).toEqual({ me: null, setlists: {} })
    expect(() => saveMe(me(), broken)).not.toThrow()
    expect(() => saveSetlist(setlist('s1'), broken)).not.toThrow()
    expect(() => clearCopy(broken)).not.toThrow()
  })
})
