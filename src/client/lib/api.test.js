import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, OfflineError, saveActiveSetlistsOffline } from './api.js'
import { connection } from './connection.svelte.js'
import { readCopy, savedSetlist } from './offline.js'

const memory = () => {
  const data = new Map()
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), removeItem: (k) => data.delete(k) }
}
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const user = { id: 'u1', email: 'u1@example.com', preferences: { sound: true } }
const gig = {
  id: 's1',
  name: 'Gig',
  showDate: '2026-11-14',
  venue: null,
  notes: null,
  archivedAt: null,
  updatedAt: '2026-11-14T10:00:00Z',
  items: [{ id: 'i1', kind: 'tune', label: null, arrangement: { id: 'a1', title: 'Blue Bossa', tempo: 150 } }],
}
const old = { ...gig, id: 's0', archivedAt: '2026-11-01T00:00:00Z' }

/** Answers like the API, or fails like a dropped network when `down`. */
let down = false
const server = vi.fn(async (url) => {
  if (down) throw new TypeError('Failed to fetch')
  const path = url.replace(/^\/api/, '')
  if (path === '/me') return json({ user })
  if (path === '/setlists') return json({ setlists: [gig, old].map(({ items, ...s }) => ({ ...s, tuneCount: items.length })) })
  if (path === '/setlists/s1') return json({ setlist: gig })
  if (path === '/setlists/s0') return json({ setlist: old })
  return json({ error: 'Not found' }, 404)
})

beforeEach(() => {
  down = false
  connection.offline = false
  vi.stubGlobal('localStorage', memory())
  vi.stubGlobal('fetch', server)
})
afterEach(() => vi.unstubAllGlobals())

describe('api offline fallback', () => {
  it('saves the user and active setlists while online, then serves them offline', async () => {
    await api.me()
    await saveActiveSetlistsOffline()
    expect(readCopy().me.id).toBe('u1')
    expect(savedSetlist('s1').items[0].arrangement.title).toBe('Blue Bossa')
    expect(savedSetlist('s0')).toBeNull() // archived

    down = true
    expect((await api.me()).id).toBe('u1')
    expect((await api.getSetlist('s1')).items[0].arrangement.tempo).toBe(150)
    expect((await api.listSetlists()).map((s) => s.id)).toEqual(['s1'])
    expect(connection.offline).toBe(true)
  })

  it('reports being back online after the next response', async () => {
    down = true
    await expect(api.listArrangements()).rejects.toBeInstanceOf(OfflineError)
    expect(connection.offline).toBe(true)
    down = false
    await api.me()
    expect(connection.offline).toBe(false)
  })

  it('still fails offline when nothing was saved', async () => {
    down = true
    await expect(api.me()).rejects.toBeInstanceOf(OfflineError)
    await expect(api.getSetlist('s1')).rejects.toBeInstanceOf(OfflineError)
  })

  it('does not hide server errors behind the saved copy', async () => {
    await api.me()
    await saveActiveSetlistsOffline()
    const err = await api.getSetlist('missing').catch((e) => e)
    expect(err).not.toBeInstanceOf(OfflineError)
    expect(err.message).toBe('Not found')
  })

  it('ignores another user\'s saved copy', async () => {
    await api.me()
    await saveActiveSetlistsOffline()
    server.mockImplementationOnce(async () => json({ user: { ...user, id: 'u2' } }))
    await api.me()
    down = true
    await expect(api.getSetlist('s1')).rejects.toBeInstanceOf(OfflineError)
  })
})
