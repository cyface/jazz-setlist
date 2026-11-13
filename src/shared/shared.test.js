import { describe, expect, it } from 'vitest'
import { describeSoloEntry, soloEntryHasDrums } from './attributes.js'
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
