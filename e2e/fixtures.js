import { test as base, expect } from '@playwright/test'

/** A tune as the API takes it. */
const tuneData = (title, extra = {}) => ({
  title,
  composer: '',
  musicalKey: '',
  tempo: 120,
  beatsPerBar: 4,
  beatUnit: 4,
  feel: 'swing',
  drumImplement: 'sticks',
  drumsEntry: 'top',
  drumsEntryNote: '',
  soloOrder: [],
  notes: '',
  ...extra,
})

async function json(response) {
  expect(response.ok(), `${response.url()} → ${response.status()} ${await response.text()}`).toBeTruthy()
  return response.status() === 204 ? null : response.json()
}

/**
 * `data`: makes tunes and setlists through the API (as the e2e user) and deletes them after the test,
 * so every test starts from an empty account.
 */
export const test = base.extend({
  data: async ({ request }, use) => {
    const made = { tunes: [], setlists: [] }
    const data = {
      async tune(title, extra) {
        const { arrangement } = await json(await request.post('/api/arrangements', { data: tuneData(title, extra) }))
        made.tunes.push(arrangement.id)
        return arrangement
      },
      /** `items`: tunes, or `{ break: 'note' }` for a set break. */
      async setlist(name, items = [], extra = {}) {
        const { setlist } = await json(await request.post('/api/setlists', { data: { name, ...extra } }))
        made.setlists.push(setlist.id)
        const body = items.map((i) => (i.break !== undefined ? { kind: 'break', label: i.break } : { kind: 'tune', arrangementId: i.id }))
        return (await json(await request.put(`/api/setlists/${setlist.id}/items`, { data: { items: body } }))).setlist
      },
      async archive(setlistId) {
        await json(await request.put(`/api/setlists/${setlistId}/archived`, { data: { archived: true } }))
      },
      async getTune(id) {
        return (await json(await request.get(`/api/arrangements/${id}`))).arrangement
      },
    }
    await use(data)
    for (const id of made.setlists) await request.delete(`/api/setlists/${id}`)
    for (const id of made.tunes) await request.delete(`/api/arrangements/${id}`)
  },

  /** A gig: set 1 Blue Bossa, So What · break · set 2 Autumn Leaves, Sunny. */
  gig: async ({ data }, use) => {
    const [bossa, soWhat, autumn, sunny] = [
      await data.tune('Blue Bossa', { tempo: 150, feel: 'bossa' }),
      await data.tune('So What', { tempo: 136, feel: 'straight' }),
      await data.tune('Autumn Leaves', { tempo: 160 }),
      await data.tune('Sunny', { tempo: 112 }),
    ]
    const setlist = await data.setlist('Winter Gig', [bossa, soWhat, { break: '20 min' }, autumn, sunny], {
      showDate: '2026-12-05',
      venue: 'The Blue Room',
    })
    await use({ setlist, tunes: { bossa, soWhat, autumn, sunny } })
  },
})

export { expect }
