/** Test data shaped like the API's responses. */

let n = 0
export const tune = (title, extra = {}) => ({
  id: `a-${title.toLowerCase().replace(/\W+/g, '-')}`,
  title,
  composer: null,
  musicalKey: null,
  tempo: 120,
  beatsPerBar: 4,
  beatUnit: 4,
  feel: 'swing',
  drumImplement: 'sticks',
  drumsEntry: 'top',
  drumsEntryNote: null,
  soloOrder: [],
  notes: null,
  documents: [],
  ...extra,
})

export const document = (arrangementId, name, extra = {}) => ({
  id: `d-${name.toLowerCase().replace(/\W+/g, '-')}`,
  arrangementId,
  type: 'lead_sheet',
  name,
  contentType: 'image/png',
  size: 48 * 1024,
  createdAt: '2026-11-21T10:00:00Z',
  ...extra,
})

export const tuneItem = (arrangement) => ({ id: `i${++n}`, kind: 'tune', label: null, arrangement })
export const breakItem = (label = null) => ({ id: `i${++n}`, kind: 'break', label, arrangement: null })

export const setlist = (items, extra = {}) => ({
  id: 's1',
  name: 'Winter Gig',
  showDate: '2026-12-05',
  venue: 'The Blue Room',
  notes: null,
  archivedAt: null,
  updatedAt: '2026-11-14T10:00:00Z',
  items,
  ...extra,
})

export const BLUE_BOSSA = tune('Blue Bossa', { tempo: 150, feel: 'bossa' })
export const SO_WHAT = tune('So What', { tempo: 136 })
export const AUTUMN_LEAVES = tune('Autumn Leaves', { tempo: 160 })
export const SUNNY = tune('Sunny', { tempo: 112 })
