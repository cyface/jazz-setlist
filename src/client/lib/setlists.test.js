import { describe, expect, it } from 'vitest'
import { activeSetlists, formatShowDate, setlistWhenWhere, tuneCountLabel } from './setlists.js'

describe('activeSetlists', () => {
  it('keeps unarchived setlists in their order', () => {
    const rows = [
      { id: 'a', archivedAt: null },
      { id: 'b', archivedAt: '2026-11-01T00:00:00Z' },
      { id: 'c', archivedAt: null },
    ]
    expect(activeSetlists(rows).map((s) => s.id)).toEqual(['a', 'c'])
  })

  it('is empty when everything is archived', () => {
    expect(activeSetlists([{ id: 'a', archivedAt: '2026-11-01T00:00:00Z' }])).toEqual([])
  })
})

describe('setlistWhenWhere', () => {
  it('joins the date and venue that are set', () => {
    expect(setlistWhenWhere({ showDate: '2026-11-14', venue: 'The Blue Room' })).toBe(`${formatShowDate('2026-11-14')} · The Blue Room`)
    expect(setlistWhenWhere({ showDate: null, venue: 'The Blue Room' })).toBe('The Blue Room')
    expect(setlistWhenWhere({ showDate: null, venue: null })).toBe('')
  })

  it('keeps the show date on its calendar day', () => {
    expect(formatShowDate('2026-11-14')).toMatch(/14/)
  })
})

describe('tuneCountLabel', () => {
  it('pluralizes', () => {
    expect(tuneCountLabel(1)).toBe('1 tune')
    expect(tuneCountLabel(0)).toBe('0 tunes')
    expect(tuneCountLabel(12)).toBe('12 tunes')
  })
})
