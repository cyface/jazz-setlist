import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestEnv } from '../../src/server/test-env.js'
import { buildImportSql } from './to-sql.js'

const EMAIL = 'importer@example.com'

const tune = (title, overrides = {}) => ({
  title,
  composer: null,
  musicalKey: null,
  tempo: 120,
  beatsPerBar: 4,
  feel: 'swing',
  drumImplement: 'sticks',
  drumsEntry: 'top',
  drumsEntryNote: null,
  soloOrder: [],
  notes: null,
  ...overrides,
})

const DATA = {
  arrangements: [
    tune('Blue Jar', { tempo: 114, drumsEntry: 'later', drumsEntryNote: 'After the bass intro' }),
    tune('Bernie’s Tune', { soloOrder: [{ type: 'trade', instruments: ['bass', 'drums'], bars: 4 }] }),
    tune('Afro Blue', { beatsPerBar: 6, beatUnit: 8 }),
  ],
  setlists: [
    { name: 'Malpractice 4/18/26', venue: null, showDate: '2026-04-18', notes: null, archived: true,
      items: [{ kind: 'tune', title: 'Blue Jar' }, { kind: 'break' }, { kind: 'tune', title: 'Bernie’s Tune' }] },
    { name: 'Malpractice Winter 2026', venue: null, showDate: null, notes: null, archived: false,
      items: [{ kind: 'tune', title: 'blue jar' }] },
  ],
}

let t
const run = async (statements) => {
  for (const s of statements) await t.env.DB.prepare(s).run()
}
const json = async (path) => (await t.api(EMAIL, 'GET', path)).json()

beforeAll(async () => {
  t = await createTestEnv()
  await t.api(EMAIL, 'GET', '/me') // provisions the users row the SQL looks up
  await run(buildImportSql(DATA, EMAIL))
})
afterAll(() => t.dispose())

describe('PolyNome import SQL', () => {
  it('imports tunes with their attributes', async () => {
    const { arrangements } = await json('/arrangements')
    expect(arrangements.map((a) => a.title)).toEqual(['Afro Blue', 'Bernie’s Tune', 'Blue Jar'])
    expect(arrangements[0]).toMatchObject({ beatsPerBar: 6, beatUnit: 8 })
    expect(arrangements[2]).toMatchObject({ tempo: 114, beatUnit: 4, drumsEntry: 'later', drumsEntryNote: 'After the bass intro' })
    expect(arrangements[1].soloOrder).toEqual([{ type: 'trade', instruments: ['bass', 'drums'], bars: 4 }])
  })

  it('links setlist items by title and archives all but the active setlist', async () => {
    const { setlists } = await json('/setlists')
    const old = setlists.find((s) => s.name === 'Malpractice 4/18/26')
    const current = setlists.find((s) => s.name === 'Malpractice Winter 2026')
    expect(old.archivedAt).toEqual(expect.any(String))
    expect(current.archivedAt).toBeNull()

    const { setlist } = await json(`/setlists/${old.id}`)
    expect(setlist.items.map((i) => i.arrangement?.title ?? i.kind)).toEqual(['Blue Jar', 'break', 'Bernie’s Tune'])
    expect((await json(`/setlists/${current.id}`)).setlist.items[0].arrangement.title).toBe('Blue Jar')
  })

  it('is safe to run again', async () => {
    await run(buildImportSql(DATA, EMAIL))
    expect((await json('/arrangements')).arrangements).toHaveLength(3)
    const { setlists } = await json('/setlists')
    expect(setlists).toHaveLength(2)
    expect(setlists.map((s) => s.tuneCount).sort()).toEqual([1, 2])
  })

  it('fails on the first statement when the user has never signed in', async () => {
    await expect(run(buildImportSql(DATA, 'nobody@example.com'))).rejects.toThrow(/NOT NULL/)
    expect((await json('/arrangements')).arrangements).toHaveLength(3)
  })

  it('rejects a setlist that names a tune not in the import', () => {
    const bad = { arrangements: [], setlists: [{ ...DATA.setlists[1], items: [{ kind: 'tune', title: 'Mystery' }] }] }
    expect(() => buildImportSql(bad, EMAIL)).toThrow('unknown tune "Mystery"')
  })

  it('rejects invalid tunes with the app’s validation', () => {
    expect(() => buildImportSql({ arrangements: [tune('Too slow', { tempo: 5 })], setlists: [] }, EMAIL)).toThrow()
  })
})
