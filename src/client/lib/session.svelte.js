import { api } from './api.js'
import { resolvePreferences } from '../../shared/preferences.js'

/** The signed-in user and their preferences, loaded once by App before any page renders.
    `soundOverride` is the metronome's mute button: it wins over `preferences.sound` until the page reloads
    or preferences are saved (null = follow the preference). */
export const session = $state({ user: null, preferences: resolvePreferences(null), soundOverride: null })

/** Whether the metronome clicks right now. */
export const soundOn = () => session.soundOverride ?? session.preferences.sound

export async function loadSession() {
  const { preferences, ...user } = await api.me()
  session.user = user
  session.preferences = preferences
}

export async function savePreferences(preferences) {
  session.preferences = await api.savePreferences(preferences)
  session.soundOverride = null
}

/** Two letters for the avatar, from the email's local part. */
export const initials = (email) => (email ?? '?').split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase() || '?'
