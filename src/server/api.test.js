import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from './index.jsx'
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
  const prefs = { hideDefaults: true, defaults: { feel: 'swing', drumImplement: 'brushes', drumsEntry: 'top', timeSignature: '6/8' } }

  it('saves preferences per user', async () => {
    const res = await t.api('prefs@example.com', 'PUT', '/me/preferences', prefs)
    expect(res.status).toBe(200)
    expect((await res.json()).preferences).toEqual(prefs)
    expect((await (await t.api('prefs@example.com', 'GET', '/me')).json()).user.preferences).toEqual(prefs)
    expect((await (await t.api('other-prefs@example.com', 'GET', '/me')).json()).user.preferences.hideDefaults).toBe(false)
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
