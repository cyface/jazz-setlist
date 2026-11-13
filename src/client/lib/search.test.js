import { describe, expect, it } from 'vitest'
import { normalize, searchTunes } from './search.js'

const tunes = [
  'Blue Monk',
  'Afro Blue',
  'Bernie’s Tune',
  'Blues for Willarene',
  'When Sunny Gets Blue',
  'Footprints',
  'Mona Lisa',
  'Señor Blues',
].map((title, i) => ({ id: String(i), title, composer: title === 'Footprints' ? 'Wayne Shorter' : null }))
const titles = (q, limit) => searchTunes(tunes, q, limit).map((a) => a.title)

describe('normalize', () => {
  it('drops case, accents and punctuation', () => {
    expect(normalize('  Señor  Bernie’s Tune! ')).toBe('senor bernies tune')
  })
})

describe('searchTunes', () => {
  it('ranks title starts, then word starts, then anywhere', () => {
    expect(titles('blue')).toEqual(['Blue Monk', 'Blues for Willarene', 'Afro Blue', 'Señor Blues', 'When Sunny Gets Blue'])
    expect(titles('lisa')).toEqual(['Mona Lisa'])
  })

  it('matches every word, in any order, across title and composer', () => {
    expect(titles('blue afro')).toEqual(['Afro Blue'])
    expect(titles('shorter')).toEqual(['Footprints'])
  })

  it('ignores accents and punctuation in the query and titles', () => {
    expect(titles('senor')).toEqual(['Señor Blues'])
    expect(titles('bernies')).toEqual(['Bernie’s Tune'])
    expect(titles("bernie's")).toEqual(['Bernie’s Tune'])
  })

  it('returns nothing for an empty query and respects the limit', () => {
    expect(titles('   ')).toEqual([])
    expect(titles('blue', 2)).toEqual(['Blue Monk', 'Blues for Willarene'])
  })
})
