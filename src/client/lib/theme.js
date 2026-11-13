import { THEMES, THEME_STORAGE_KEY } from '../../shared/theme.js'

export function readTheme(storage = globalThis.localStorage) {
  try {
    const theme = storage.getItem(THEME_STORAGE_KEY)
    return THEMES.includes(theme) ? theme : 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(theme, root = document.documentElement, storage = globalThis.localStorage) {
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
  try {
    if (theme === 'system') storage.removeItem(THEME_STORAGE_KEY)
    else storage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage blocked (private mode): the choice lasts for this page only.
  }
}
