import { DRUM_IMPLEMENTS, DRUMS_ENTRIES, FEELS, TIME_SIGNATURES } from './attributes.js'

/** The attributes a user can set a default for, with their allowed values. */
export const DEFAULTABLE = {
  feel: FEELS,
  drumImplement: DRUM_IMPLEMENTS,
  drumsEntry: DRUMS_ENTRIES,
  timeSignature: TIME_SIGNATURES,
}

export const DEFAULT_PREFERENCES = Object.freeze({
  hideDefaults: false,
  /** Metronome clicks. Off, the metronome still counts visually (a silent count-off on stage). */
  sound: true,
  defaults: Object.freeze({ feel: 'swing', drumImplement: 'sticks', drumsEntry: 'top', timeSignature: '4/4' }),
})

/** Stored preferences (possibly null, partial or from an older version) merged over the defaults. */
export function resolvePreferences(stored) {
  const defaults = { ...DEFAULT_PREFERENCES.defaults }
  for (const [key, allowed] of Object.entries(DEFAULTABLE)) {
    const value = stored?.defaults?.[key]
    if (allowed.includes(value)) defaults[key] = value
  }
  const hideDefaults = typeof stored?.hideDefaults === 'boolean' ? stored.hideDefaults : DEFAULT_PREFERENCES.hideDefaults
  const sound = typeof stored?.sound === 'boolean' ? stored.sound : DEFAULT_PREFERENCES.sound
  return { hideDefaults, sound, defaults }
}

/** True when list views should leave out this attribute value because it is the user's default.
    For `timeSignature` the value is the "6/8" string (see timeSignature() in attributes.js). */
export const isHiddenDefault = (preferences, key, value) =>
  preferences.hideDefaults && preferences.defaults[key] === value
