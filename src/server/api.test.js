import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from './index.jsx'
import { MAX_DOCUMENT_BYTES, MAX_DOCUMENTS_PER_TUNE } from '../shared/documents.js'
import { createTestEnv, sampleArrangement } from './test-env.js'

const TIM = 'tim@example.com'
const OTHER = 'other@example.com'

let t
beforeAll(async () => {
  t = await createTestEnv()
})
afterAll(() => t.dispose())

async function createArrangement(email, overrides) {
  const res = await t.api(email, 'POST', '/arrangements', sampleArrangement(overrides))
  expect(res.status).toBe(201)
  return (await res.json()).arrangement
}

describe('auth', () => {
  it('rejects requests without the Access header', async () => {
    const res = await app.request('http://jazz.test/api/me', {}, t.env)
    expect(res.status).toBe(401)
  })

  it('uses DEV_AUTH_EMAIL only on localhost', async () => {
    const env = { ...t.env, DEV_AUTH_EMAIL: 'dev@example.com' }
    const local = await app.request('http://localhost/api/me', {}, env)
    expect((await local.json()).user.email).toBe('dev@example.com')
    const remote = await app.request('https://setlist.example.com/api/me', {}, env)
    expect(remote.status).toBe(401)
  })

  it('starts users on the default preferences', async () => {
    const { user } = await (await t.api('fresh@example.com', 'GET', '/me')).json()
    expect(user.preferences).toEqual({
      hideDefaults: false,
      sound: true,
      defaults: { feel: 'swing', drumImplement: 'sticks', drumsEntry: 'top', timeSignature: '4/4' },
    })
  })

  it('provisions a user once per email, case-insensitively', async () => {
    const a = await (await t.api('Case@Example.com', 'GET', '/me')).json()
    const b = await (await t.api('case@example.com', 'GET', '/me')).json()
    expect(a.user.id).toBe(b.user.id)
  })
})

describe('preferences', () => {
  const prefs = { hideDefaults: true, sound: true, defaults: { feel: 'swing', drumImplement: 'brushes', drumsEntry: 'top', timeSignature: '6/8' } }

  it('saves preferences per user', async () => {
    const res = await t.api('prefs@example.com', 'PUT', '/me/preferences', prefs)
    expect(res.status).toBe(200)
    expect((await res.json()).preferences).toEqual(prefs)
    expect((await (await t.api('prefs@example.com', 'GET', '/me')).json()).user.preferences).toEqual(prefs)
    expect((await (await t.api('other-prefs@example.com', 'GET', '/me')).json()).user.preferences.hideDefaults).toBe(false)
  })

  it.each(['bossa', 'latin'])('accepts %s as the default feel', async (feel) => {
    const body = { ...prefs, defaults: { ...prefs.defaults, feel } }
    const res = await t.api('prefs@example.com', 'PUT', '/me/preferences', body)
    expect(res.status).toBe(200)
    expect((await res.json()).preferences.defaults.feel).toBe(feel)
  })

  it('round-trips sound, and keeps it on when an older client leaves it out', async () => {
    const off = await t.api('sound@example.com', 'PUT', '/me/preferences', { ...prefs, sound: false })
    expect((await off.json()).preferences.sound).toBe(false)
    expect((await (await t.api('sound@example.com', 'GET', '/me')).json()).user.preferences.sound).toBe(false)

    const { sound: _, ...older } = prefs
    const res = await t.api('sound@example.com', 'PUT', '/me/preferences', older)
    expect(res.status).toBe(200)
    expect((await res.json()).preferences.sound).toBe(true)

    const bad = await t.api('sound@example.com', 'PUT', '/me/preferences', { ...prefs, sound: 'loud' })
    expect(bad.status).toBe(400)
  })

  it('rejects invalid preferences', async () => {
    const res = await t.api('prefs@example.com', 'PUT', '/me/preferences', { ...prefs, defaults: { ...prefs.defaults, feel: 'polka' } })
    expect(res.status).toBe(400)
    expect((await res.json()).issues[0].path).toBe('defaults.feel')
  })
})

describe('arrangements', () => {
  it('creates, reads, updates and deletes', async () => {
    const created = await createArrangement(TIM)
    expect(created).toMatchObject({ title: 'Autumn Leaves', feel: 'swing', drumsEntry: 'later' })
    expect(created.soloOrder).toHaveLength(3)
    expect(created).not.toHaveProperty('userId')

    const updated = await t.api(TIM, 'PUT', `/arrangements/${created.id}`, sampleArrangement({ tempo: 200 }))
    expect((await updated.json()).arrangement.tempo).toBe(200)

    expect((await t.api(TIM, 'DELETE', `/arrangements/${created.id}`)).status).toBe(204)
    expect((await t.api(TIM, 'GET', `/arrangements/${created.id}`)).status).toBe(404)
  })

  it('stores the time signature, defaulting the beat unit to 4', async () => {
    expect((await createArrangement(TIM, { beatsPerBar: 3 })).beatUnit).toBe(4)
    expect(await createArrangement(TIM, { beatsPerBar: 6, beatUnit: 8 })).toMatchObject({ beatsPerBar: 6, beatUnit: 8 })
    const res = await t.api(TIM, 'POST', '/arrangements', sampleArrangement({ beatUnit: 3 }))
    expect(res.status).toBe(400)
  })

  it('stores a bossa feel', async () => {
    expect((await createArrangement(TIM, { feel: 'bossa' })).feel).toBe('bossa')
  })

  it('stores a latin feel', async () => {
    expect((await createArrangement(TIM, { feel: 'latin' })).feel).toBe('latin')
  })

  it('clears the drums entry note when drums play from the top', async () => {
    const a = await createArrangement(TIM, { drumsEntry: 'top', drumsEntryNote: 'ignored' })
    expect(a.drumsEntryNote).toBeNull()
  })

  it('rejects invalid input with issues', async () => {
    const res = await t.api(TIM, 'POST', '/arrangements', sampleArrangement({ tempo: 5, feel: 'polka' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.issues.map((i) => i.path)).toEqual(expect.arrayContaining(['tempo', 'feel']))
  })

  it('rejects a trade with fewer than two instruments', async () => {
    const res = await t.api(
      TIM,
      'POST',
      '/arrangements',
      sampleArrangement({ soloOrder: [{ type: 'trade', instruments: ['drums'], bars: 4 }] }),
    )
    expect(res.status).toBe(400)
  })

  it("hides other users' arrangements", async () => {
    const mine = await createArrangement(TIM, { title: 'Mine' })
    expect((await t.api(OTHER, 'GET', `/arrangements/${mine.id}`)).status).toBe(404)
    expect((await t.api(OTHER, 'PUT', `/arrangements/${mine.id}`, sampleArrangement())).status).toBe(404)
    expect((await t.api(OTHER, 'DELETE', `/arrangements/${mine.id}`)).status).toBe(404)
    const list = await (await t.api(OTHER, 'GET', '/arrangements')).json()
    expect(list.arrangements.find((a) => a.id === mine.id)).toBeUndefined()
  })

  it('lists by title, case-insensitively', async () => {
    const email = 'sort@example.com'
    for (const title of ['so What', 'Blue Bossa', 'all the Things']) await createArrangement(email, { title })
    const { arrangements } = await (await t.api(email, 'GET', '/arrangements')).json()
    expect(arrangements.map((a) => a.title)).toEqual(['all the Things', 'Blue Bossa', 'so What'])
  })
})

describe('setlists', () => {
  it('stores tunes and set breaks in order', async () => {
    const a = await createArrangement(TIM, { title: 'Blue Monk' })
    const b = await createArrangement(TIM, { title: 'Footprints' })
    const res = await t.api(TIM, 'POST', '/setlists', { name: 'Friday at the Lounge', showDate: '2026-11-20' })
    expect(res.status).toBe(201)
    const { setlist } = await res.json()

    const put = await t.api(TIM, 'PUT', `/setlists/${setlist.id}/items`, {
      items: [
        { kind: 'tune', arrangementId: a.id },
        { kind: 'break', label: '15 min' },
        { kind: 'tune', arrangementId: b.id },
      ],
    })
    expect(put.status).toBe(200)
    const { items } = (await put.json()).setlist
    expect(items.map((i) => i.kind)).toEqual(['tune', 'break', 'tune'])
    expect(items[0].arrangement.title).toBe('Blue Monk')
    expect(items[1].label).toBe('15 min')
    expect(items[2].arrangement.title).toBe('Footprints')

    const list = await (await t.api(TIM, 'GET', '/setlists')).json()
    expect(list.setlists.find((s) => s.id === setlist.id).tuneCount).toBe(2)
  })

  it('saves a setlist longer than one D1 statement can bind', async () => {
    // Regression: 17+ items in one INSERT went over D1's 100 bound values and the save failed.
    const a = await createArrangement(TIM)
    const { setlist } = await (await t.api(TIM, 'POST', '/setlists', { name: 'Long gig' })).json()
    const items = Array.from({ length: 40 }, (_, i) => (i % 10 === 9 ? { kind: 'break', label: `break ${i}` } : { kind: 'tune', arrangementId: a.id }))
    const res = await t.api(TIM, 'PUT', `/setlists/${setlist.id}/items`, { items })
    expect(res.status).toBe(200)
    const saved = (await res.json()).setlist.items
    expect(saved).toHaveLength(40)
    expect(saved.map((i) => i.label ?? i.kind)).toEqual(items.map((i) => i.label ?? i.kind))
  })

  it('replaces items on each save', async () => {
    const a = await createArrangement(TIM)
    const { setlist } = await (await t.api(TIM, 'POST', '/setlists', { name: 'Replace' })).json()
    await t.api(TIM, 'PUT', `/setlists/${setlist.id}/items`, { items: [{ kind: 'tune', arrangementId: a.id }] })
    const res = await t.api(TIM, 'PUT', `/setlists/${setlist.id}/items`, { items: [] })
    expect((await res.json()).setlist.items).toEqual([])
  })

  it("rejects another user's arrangement in a setlist", async () => {
    const theirs = await createArrangement(OTHER)
    const { setlist } = await (await t.api(TIM, 'POST', '/setlists', { name: 'Gig' })).json()
    const res = await t.api(TIM, 'PUT', `/setlists/${setlist.id}/items`, {
      items: [{ kind: 'tune', arrangementId: theirs.id }],
    })
    expect(res.status).toBe(400)
  })

  it('drops a deleted arrangement from setlists', async () => {
    const a = await createArrangement(TIM)
    const { setlist } = await (await t.api(TIM, 'POST', '/setlists', { name: 'Cascade' })).json()
    await t.api(TIM, 'PUT', `/setlists/${setlist.id}/items`, { items: [{ kind: 'tune', arrangementId: a.id }] })
    await t.api(TIM, 'DELETE', `/arrangements/${a.id}`)
    const { setlist: after } = await (await t.api(TIM, 'GET', `/setlists/${setlist.id}`)).json()
    expect(after.items).toEqual([])
  })

  it("hides other users' setlists", async () => {
    const { setlist } = await (await t.api(TIM, 'POST', '/setlists', { name: 'Private' })).json()
    expect((await t.api(OTHER, 'GET', `/setlists/${setlist.id}`)).status).toBe(404)
    expect((await t.api(OTHER, 'PUT', `/setlists/${setlist.id}/items`, { items: [] })).status).toBe(404)
    expect((await t.api(OTHER, 'DELETE', `/setlists/${setlist.id}`)).status).toBe(404)
    expect((await t.api(OTHER, 'PUT', `/setlists/${setlist.id}/archived`, { archived: true })).status).toBe(404)
  })

  it('archives and restores a setlist without losing its tunes', async () => {
    const a = await createArrangement(TIM)
    const { setlist } = await (await t.api(TIM, 'POST', '/setlists', { name: 'Old gig' })).json()
    expect(setlist.archivedAt).toBeNull()
    await t.api(TIM, 'PUT', `/setlists/${setlist.id}/items`, { items: [{ kind: 'tune', arrangementId: a.id }] })

    const archived = (await (await t.api(TIM, 'PUT', `/setlists/${setlist.id}/archived`, { archived: true })).json()).setlist
    expect(archived.archivedAt).toEqual(expect.any(String))
    expect(archived.items).toHaveLength(1)
    const listed = (await (await t.api(TIM, 'GET', '/setlists')).json()).setlists.find((s) => s.id === setlist.id)
    expect(listed.archivedAt).toBe(archived.archivedAt)

    // Editing the details keeps it archived.
    const edited = (await (await t.api(TIM, 'PUT', `/setlists/${setlist.id}`, { name: 'Old gig (2019)' })).json()).setlist
    expect(edited.archivedAt).toBe(archived.archivedAt)

    const restored = (await (await t.api(TIM, 'PUT', `/setlists/${setlist.id}/archived`, { archived: false })).json()).setlist
    expect(restored.archivedAt).toBeNull()
    expect(restored.items).toHaveLength(1)
  })

  it('appends a tune to the end of a setlist', async () => {
    const a = await createArrangement(TIM, { title: 'Afro Blue' })
    const b = await createArrangement(TIM, { title: 'Footprints' })
    const { setlist } = await (await t.api(TIM, 'POST', '/setlists', { name: 'Append' })).json()
    await t.api(TIM, 'PUT', `/setlists/${setlist.id}/items`, {
      items: [{ kind: 'tune', arrangementId: a.id }, { kind: 'break', label: null }],
    })

    const res = await t.api(TIM, 'POST', `/setlists/${setlist.id}/items`, { arrangementId: b.id })
    expect(res.status).toBe(201)
    const { items } = (await res.json()).setlist
    expect(items.map((i) => i.arrangement?.title ?? 'break')).toEqual(['Afro Blue', 'break', 'Footprints'])

    // Adding to an empty setlist starts at the top; the same tune can be added twice.
    const { setlist: empty } = await (await t.api(TIM, 'POST', '/setlists', { name: 'Empty' })).json()
    await t.api(TIM, 'POST', `/setlists/${empty.id}/items`, { arrangementId: a.id })
    const twice = await (await t.api(TIM, 'POST', `/setlists/${empty.id}/items`, { arrangementId: a.id })).json()
    expect(twice.setlist.items.map((i) => i.arrangement.title)).toEqual(['Afro Blue', 'Afro Blue'])
  })

  it('stops appending at the setlist item limit', async () => {
    const a = await createArrangement(TIM)
    const { setlist } = await (await t.api(TIM, 'POST', '/setlists', { name: 'Full' })).json()
    const items = Array.from({ length: 200 }, () => ({ kind: 'break', label: null }))
    expect((await t.api(TIM, 'PUT', `/setlists/${setlist.id}/items`, { items })).status).toBe(200)
    expect((await t.api(TIM, 'POST', `/setlists/${setlist.id}/items`, { arrangementId: a.id })).status).toBe(400)
  })

  it('reports which setlists already have a tune', async () => {
    const a = await createArrangement(OTHER, { title: 'Afro Blue' })
    const b = await createArrangement(OTHER, { title: 'Footprints' })
    const { setlist: withA } = await (await t.api(OTHER, 'POST', '/setlists', { name: 'Has it' })).json()
    const { setlist: without } = await (await t.api(OTHER, 'POST', '/setlists', { name: 'Lacks it' })).json()
    await t.api(OTHER, 'POST', `/setlists/${withA.id}/items`, { arrangementId: a.id })
    await t.api(OTHER, 'POST', `/setlists/${without.id}/items`, { arrangementId: b.id })

    const { setlists } = await (await t.api(OTHER, 'GET', `/setlists?contains=${a.id}`)).json()
    const has = Object.fromEntries(setlists.map((s) => [s.name, s.hasTune]))
    expect(has).toMatchObject({ 'Has it': true, 'Lacks it': false })
    // Without the parameter the field is left out.
    const plain = (await (await t.api(OTHER, 'GET', '/setlists')).json()).setlists
    expect(plain.every((s) => !('hasTune' in s))).toBe(true)
  })

  it("won't append another user's tune or to another user's setlist", async () => {
    const theirs = await createArrangement(OTHER)
    const { setlist } = await (await t.api(TIM, 'POST', '/setlists', { name: 'Mine' })).json()
    expect((await t.api(TIM, 'POST', `/setlists/${setlist.id}/items`, { arrangementId: theirs.id })).status).toBe(400)
    expect((await t.api(OTHER, 'POST', `/setlists/${setlist.id}/items`, { arrangementId: theirs.id })).status).toBe(404)
    expect((await t.api(TIM, 'POST', `/setlists/${setlist.id}/items`, {})).status).toBe(400)
    const { setlist: after } = await (await t.api(TIM, 'GET', `/setlists/${setlist.id}`)).json()
    expect(after.items).toEqual([])
  })

  it('rejects an invalid archive request', async () => {
    const { setlist } = await (await t.api(TIM, 'POST', '/setlists', { name: 'Bad archive' })).json()
    expect((await t.api(TIM, 'PUT', `/setlists/${setlist.id}/archived`, { archived: 'yes' })).status).toBe(400)
  })
})

describe('page shell', () => {
  it('renders the Svelte mount point', async () => {
    const res = await app.request('http://jazz.test/setlists', {}, t.env)
    expect(res.headers.get('content-type')).toContain('text/html')
    const html = await res.text()
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain('<div id="app"></div>')
  })

  it('applies the saved theme in <head> before the app loads', async () => {
    const html = await (await app.request('http://jazz.test/', {}, t.env)).text()
    const head = html.slice(0, html.indexOf('</head>'))
    expect(head).toContain('<meta name="color-scheme" content="light dark"/>')
    expect(head).toContain('document.documentElement.dataset.theme=t')
  })

  it('returns JSON 404 for unknown API paths', async () => {
    const res = await t.api(TIM, 'GET', '/nope')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
  })
})

describe('documents', () => {
  const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 1, 2, 3, 255])
  const png = (name = 'autumn leaves.png') => new File([PNG], name, { type: 'image/png' })
  const fileUrl = (doc) => `/arrangements/${doc.arrangementId}/documents/${doc.id}/file`
  const stored = async (doc) => Boolean(await t.env.DOCUMENTS.head(`${doc.arrangementId}/${doc.id}`))

  async function attach(email, arrangementId, file = png(), type = 'lead_sheet') {
    const res = await t.upload(email, arrangementId, file, type)
    expect(res.status).toBe(201)
    return (await res.json()).arrangement.documents.at(-1)
  }

  it('attaches a binary file to a tune and serves the same bytes back', async () => {
    const tune = await createArrangement(TIM)
    expect(tune.documents).toEqual([])

    const res = await t.upload(TIM, tune.id, png(), 'lead_sheet')
    expect(res.status).toBe(201)
    const { arrangement } = await res.json()
    expect(arrangement.title).toBe(tune.title)
    expect(arrangement.documents).toEqual([
      { id: expect.any(String), arrangementId: tune.id, type: 'lead_sheet', name: 'autumn leaves.png', contentType: 'image/png', size: PNG.length, createdAt: expect.any(String) },
    ])

    const file = await t.api(TIM, 'GET', fileUrl(arrangement.documents[0]))
    expect(file.status).toBe(200)
    expect(file.headers.get('content-type')).toBe('image/png')
    expect(file.headers.get('content-disposition')).toBe("inline; filename*=UTF-8''autumn%20leaves.png")
    expect(file.headers.get('x-content-type-options')).toBe('nosniff')
    expect(file.headers.get('cache-control')).toContain('private')
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(PNG)
  })

  it('returns a tune’s documents wherever the tune is returned', async () => {
    const tune = await createArrangement(TIM, { title: 'Documented' })
    const bare = await createArrangement(TIM, { title: 'Undocumented' })
    const sheet = await attach(TIM, tune.id)
    const chart = await attach(TIM, tune.id, new File(['%PDF-1.7'], 'chart.pdf', { type: 'application/pdf' }), 'arrangement')

    const ids = (a) => a.documents.map((d) => d.id)
    expect(ids((await (await t.api(TIM, 'GET', `/arrangements/${tune.id}`)).json()).arrangement)).toEqual([sheet.id, chart.id])

    const { arrangements: all } = await (await t.api(TIM, 'GET', '/arrangements')).json()
    expect(ids(all.find((a) => a.id === tune.id))).toEqual([sheet.id, chart.id])
    expect(all.find((a) => a.id === bare.id).documents).toEqual([])

    const saved = await (await t.api(TIM, 'PUT', `/arrangements/${tune.id}`, sampleArrangement({ title: 'Documented', tempo: 99 }))).json()
    expect(ids(saved.arrangement)).toEqual([sheet.id, chart.id])

    // In a setlist, once per tune even when the tune is played twice.
    const { setlist } = await (await t.api(TIM, 'POST', '/setlists', { name: 'With documents' })).json()
    const items = [tune, bare, tune].map((a) => ({ kind: 'tune', arrangementId: a.id }))
    const full = await (await t.api(TIM, 'PUT', `/setlists/${setlist.id}/items`, { items })).json()
    expect(full.setlist.items.map((i) => ids(i.arrangement))).toEqual([[sheet.id, chart.id], [], [sheet.id, chart.id]])
  })

  it('only lets images and PDFs open in the browser; anything else downloads', async () => {
    const tune = await createArrangement(TIM)
    const html = await attach(TIM, tune.id, new File(['<script>alert(1)</script>'], 'notes.html', { type: 'text/html' }), 'extended_notes')
    const svg = await attach(TIM, tune.id, new File(['<svg/>'], 'sheet.svg', { type: 'image/svg+xml' }))
    const untyped = await attach(TIM, tune.id, new File([PNG], 'chart.mus'), 'arrangement')
    expect(untyped.contentType).toBe('application/octet-stream')

    for (const doc of [html, svg, untyped]) {
      const res = await t.api(TIM, 'GET', fileUrl(doc))
      expect(res.headers.get('content-disposition')).toMatch(/^attachment;/)
      expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    }
  })

  it('changes a document’s type', async () => {
    const tune = await createArrangement(TIM)
    const doc = await attach(TIM, tune.id)
    const res = await t.api(TIM, 'PUT', `/arrangements/${tune.id}/documents/${doc.id}`, { type: 'extended_notes' })
    expect(res.status).toBe(200)
    expect((await res.json()).arrangement.documents).toMatchObject([{ id: doc.id, type: 'extended_notes', name: doc.name }])

    const bad = await t.api(TIM, 'PUT', `/arrangements/${tune.id}/documents/${doc.id}`, { type: 'tab' })
    expect(bad.status).toBe(400)
  })

  it('deletes a document and its file', async () => {
    const tune = await createArrangement(TIM)
    const [gone, kept] = [await attach(TIM, tune.id), await attach(TIM, tune.id)]
    expect(await stored(gone)).toBe(true)

    const res = await t.api(TIM, 'DELETE', `/arrangements/${tune.id}/documents/${gone.id}`)
    expect(res.status).toBe(200)
    expect((await res.json()).arrangement.documents.map((d) => d.id)).toEqual([kept.id])
    expect(await stored(gone)).toBe(false)
    expect(await stored(kept)).toBe(true)
    expect((await t.api(TIM, 'GET', fileUrl(gone))).status).toBe(404)
  })

  it('deletes a tune’s files with the tune', async () => {
    const tune = await createArrangement(TIM)
    const doc = await attach(TIM, tune.id)
    expect((await t.api(TIM, 'DELETE', `/arrangements/${tune.id}`)).status).toBe(204)
    expect(await stored(doc)).toBe(false)
    expect((await t.api(TIM, 'GET', fileUrl(doc))).status).toBe(404)
  })

  it("hides other users' documents", async () => {
    const tune = await createArrangement(TIM)
    const mine = await createArrangement(OTHER)
    const doc = await attach(TIM, tune.id)

    expect((await t.upload(OTHER, tune.id, png())).status).toBe(404)
    expect((await t.api(OTHER, 'GET', fileUrl(doc))).status).toBe(404)
    expect((await t.api(OTHER, 'PUT', `/arrangements/${tune.id}/documents/${doc.id}`, { type: 'arrangement' })).status).toBe(404)
    expect((await t.api(OTHER, 'DELETE', `/arrangements/${tune.id}/documents/${doc.id}`)).status).toBe(404)
    // Not through one of their own tunes either.
    expect((await t.api(OTHER, 'GET', `/arrangements/${mine.id}/documents/${doc.id}/file`)).status).toBe(404)
    expect((await t.api(OTHER, 'DELETE', `/arrangements/${mine.id}/documents/${doc.id}`)).status).toBe(404)
    expect(await stored(doc)).toBe(true)
    expect((await (await t.api(OTHER, 'GET', '/arrangements')).json()).arrangements.every((a) => a.documents.length === 0)).toBe(true)
  })

  it('rejects an upload without a valid type or file, or over the size limit', async () => {
    const tune = await createArrangement(TIM)
    expect((await t.upload(TIM, tune.id, png(), 'tab')).status).toBe(400)
    expect((await t.upload(TIM, tune.id, png(), null)).status).toBe(400)
    expect((await t.upload(TIM, tune.id, null)).status).toBe(400)
    expect((await t.upload(TIM, tune.id, new File([], 'empty.png', { type: 'image/png' }))).status).toBe(400)
    expect((await t.api(TIM, 'POST', `/arrangements/${tune.id}/documents`, { type: 'lead_sheet' })).status).toBe(400)

    const big = await t.upload(TIM, tune.id, new File([new Uint8Array(MAX_DOCUMENT_BYTES + 1)], 'big.png', { type: 'image/png' }))
    expect(big.status).toBe(413)
    expect((await big.json()).error).toBe('A document can be at most 20 MB')
    expect((await (await t.api(TIM, 'GET', `/arrangements/${tune.id}`)).json()).arrangement.documents).toEqual([])
  })

  it('refuses an upload posted from another site', async () => {
    const tune = await createArrangement(TIM)
    const res = await t.upload(TIM, tune.id, png(), 'lead_sheet', 'https://evil.example')
    expect(res.status).toBe(403)
    expect((await (await t.api(TIM, 'GET', `/arrangements/${tune.id}`)).json()).arrangement.documents).toEqual([])
    // The same page can't delete either; the app's own origin can.
    const headers = { 'CF-Access-Authenticated-User-Email': TIM, origin: 'https://evil.example' }
    expect((await app.request(`http://jazz.test/api/arrangements/${tune.id}`, { method: 'DELETE', headers }, t.env)).status).toBe(403)
    headers.origin = 'http://jazz.test'
    expect((await app.request(`http://jazz.test/api/arrangements/${tune.id}`, { method: 'DELETE', headers }, t.env)).status).toBe(204)
  })

  it('names the download safely whatever the file was called', async () => {
    const tune = await createArrangement(TIM)
    const doc = await attach(TIM, tune.id, png("Don't Get Around (take 2) *final*.png"))
    const res = await t.api(TIM, 'GET', fileUrl(doc))
    expect(res.headers.get('content-disposition')).toBe("inline; filename*=UTF-8''Don%27t%20Get%20Around%20%28take%202%29%20%2Afinal%2A.png")
  })

  it('stops at the per-tune document limit', async () => {
    const tune = await createArrangement(TIM)
    for (let i = 0; i < MAX_DOCUMENTS_PER_TUNE; i++) await attach(TIM, tune.id, png(`page ${i}.png`))
    const res = await t.upload(TIM, tune.id, png())
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/at most 20 documents/)
  })
})
