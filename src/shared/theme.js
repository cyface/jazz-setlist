export const THEMES = ['system', 'dark', 'light']
export const THEME_STORAGE_KEY = 'jazz-setlist-theme'

export const nextTheme = (theme) => THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]

/** Inlined in <head> by the shell so a saved theme applies before first paint. */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`
