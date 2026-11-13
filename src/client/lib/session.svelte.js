import { api } from './api.js'
import { resolvePreferences } from '../../shared/preferences.js'

/** The signed-in user and their preferences, loaded once by App before any page renders. */
export const session = $state({ user: null, preferences: resolvePreferences(null) })

export async function loadSession() {
  const { preferences, ...user } = await api.me()
  session.user = user
  session.preferences = preferences
}

export async function savePreferences(preferences) {
  session.preferences = await api.savePreferences(preferences)
}

/** Two letters for the avatar, from the email's local part. */
export const initials = (email) => (email ?? '?').split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase() || '?'
