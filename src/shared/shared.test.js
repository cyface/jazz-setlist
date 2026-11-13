import { describe, expect, it } from 'vitest'
import { INSTRUMENTS, describeSoloEntry, instrumentIcon, soloEntryHasDrums, soloEntryIcons } from './attributes.js'
import { moveItem, numberSets } from './setlist.js'

describe('describeSoloEntry', () => {
  it('describes each solo type', () => {
    expect(describeSoloEntry({ type: 'solo', instrument: 'piano' })).toBe('Piano')
    expect(describeSoloEntry({ type: 'trade', instruments: ['drums', 'bass'], bars: 4 })).toBe(
      'Drums ⇄ Bass trade 4s',
    )
    expect(describeSoloEntry({ type: 'over_head', instrument: 'drums' })).toBe('Drums over the head out')
  })

  it('detects drums in any solo type', () => {
    expect(soloEntryHasDrums({ type: 'solo', instrument: 'drums' })).toBe(true)
    expect(soloEntryHasDrums({ type: 'trade', instruments: ['sax', 'drums'], bars: 8 })).toBe(true)
    expect(soloEntryHasDrums({ type: 'solo', instrument: 'bass' })).toBe(false)
  })
})

describe('instrumentIcon', () => {
  it('has an icon for every suggested instrument', () => {
    for (const instrument of INSTRUMENTS) expect(instrumentIcon(instrument)).toBeTruthy()
    expect(instrumentIcon('piano')).toBe('piano')
    expect(instrumentIcon('drums')).toBe('drum')
  })

  it('ignores case and surrounding spaces, and knows common other names', () => {
    expect(instrumentIcon(' Sax ')).toBe('sax')
    expect(instrumentIcon('Tenor')).toBe('sax')
    expect(instrumentIcon('upright bass')).toBe('bass')
    expect(instrumentIcon('vibraphone')).toBe('vibes')
  })

  it('returns null for free-text instruments without an icon', () => {
    expect(instrumentIcon('flute')).toBeNull()
    expect(instrumentIcon('')).toBeNull()
    expect(instrumentIcon(undefined)).toBeNull()
  })
})

describe('soloEntryIcons', () => {
  it("uses the soloist's instrument, falling back to the mic", () => {
    expect(soloEntryIcons({ type: 'solo', instrument: 'guitar' })).toEqual(['guitar'])
    expect(soloEntryIcons({ type: 'solo', instrument: 'flute' })).toEqual(['solo'])
  })

  it('adds the loop for over the head out', () => {
    expect(soloEntryIcons({ type: 'over_head', instrument: 'drums' })).toEqual(['drum', 'over_head'])
    expect(soloEntryIcons({ type: 'over_head', instrument: 'flute' })).toEqual(['solo', 'over_head'])
  })

  it('keeps the trade arrows for trades', () => {
    expect(soloEntryIcons({ type: 'trade', instruments: ['drums', 'bass'], bars: 4 })).toEqual(['trade'])
  })
})

describe('numberSets', () => {
  it('numbers tunes within each set and marks which set a break ends', () => {
    const out = numberSets([
      { kind: 'tune', id: 'a' },
      { kind: 'tune', id: 'b' },
      { kind: 'break' },
      { kind: 'tune', id: 'c' },
    ])
    expect(out).toEqual([
      { kind: 'tune', id: 'a', set: 1, number: 1 },
      { kind: 'tune', id: 'b', set: 1, number: 2 },
      { kind: 'break', endsSet: 1 },
      { kind: 'tune', id: 'c', set: 2, number: 1 },
    ])
  })
})

describe('moveItem', () => {
  it('moves an item and ignores out-of-range targets', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
    const same = ['a', 'b']
    expect(moveItem(same, 0, -1)).toBe(same)
    expect(moveItem(same, 1, 2)).toBe(same)
  })
})
