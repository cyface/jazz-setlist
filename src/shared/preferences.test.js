import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES, isHiddenDefault, resolvePreferences } from './preferences.js'
import { parseTimeSignature, timeSignature } from './attributes.js'

describe('resolvePreferences', () => {
  it('returns the defaults when nothing is stored', () => {
    expect(resolvePreferences(null)).toEqual(DEFAULT_PREFERENCES)
  })

  it('keeps valid stored values and fills in missing ones', () => {
    expect(resolvePreferences({ hideDefaults: true, defaults: { drumImplement: 'brushes' } })).toEqual({
      hideDefaults: true,
      defaults: { feel: 'swing', drumImplement: 'brushes', drumsEntry: 'top', timeSignature: '4/4' },
    })
  })

  it('ignores invalid stored values', () => {
    expect(resolvePreferences({ hideDefaults: 'yes', defaults: { feel: 'polka' } })).toEqual(DEFAULT_PREFERENCES)
  })

  it('returns a copy that can be edited', () => {
    const p = resolvePreferences(null)
    p.defaults.feel = 'straight'
    expect(DEFAULT_PREFERENCES.defaults.feel).toBe('swing')
  })
})

describe('isHiddenDefault', () => {
  const prefs = { hideDefaults: true, defaults: { feel: 'swing', drumImplement: 'brushes', drumsEntry: 'top', timeSignature: '4/4' } }

  it('hides values equal to the default only when hiding is on', () => {
    expect(isHiddenDefault(prefs, 'feel', 'swing')).toBe(true)
    expect(isHiddenDefault(prefs, 'feel', 'straight')).toBe(false)
    expect(isHiddenDefault(prefs, 'drumImplement', 'sticks')).toBe(false)
    expect(isHiddenDefault({ ...prefs, hideDefaults: false }, 'feel', 'swing')).toBe(false)
    expect(isHiddenDefault(prefs, 'timeSignature', '4/4')).toBe(true)
    expect(isHiddenDefault(prefs, 'timeSignature', '6/8')).toBe(false)
  })
})

describe('time signatures', () => {
  it('formats and parses', () => {
    expect(timeSignature({ beatsPerBar: 6, beatUnit: 8 })).toBe('6/8')
    expect(timeSignature({ beatsPerBar: 3 })).toBe('3/4')
    expect(parseTimeSignature('12/8')).toEqual({ beatsPerBar: 12, beatUnit: 8 })
  })

  it('ignores an unknown default time signature', () => {
    expect(resolvePreferences({ defaults: { timeSignature: '5/3' } }).defaults.timeSignature).toBe('4/4')
  })
})
