// "Add to home screen" prompt logic, ported from cyface-invoice's InstallPrompt.

export const INSTALL_DISMISSED_KEY = 'pwa-install-dismissed'

/** iPhone/iPad Safari, which has no beforeinstallprompt: show Share-sheet steps instead. */
export function isIOSSafari(userAgent) {
  const isIOS = /iPad|iPhone|iPod/.test(userAgent)
  const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(userAgent)
  return isIOS && isSafari
}

/** Offer install only on phones, and not when already running as the installed app. */
export function shouldOfferInstall(win = globalThis.window) {
  const standalone = win.matchMedia('(display-mode: standalone)').matches || win.navigator.standalone === true
  const mobile = !win.matchMedia('(min-width: 768px)').matches
  return mobile && !standalone
}

export function wasInstallDismissed(storage = globalThis.localStorage) {
  try {
    return storage.getItem(INSTALL_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

export function rememberInstallDismissed(storage = globalThis.localStorage) {
  try {
    storage.setItem(INSTALL_DISMISSED_KEY, '1')
  } catch {
    // Storage blocked (private mode): the prompt stays hidden for this page only.
  }
}
