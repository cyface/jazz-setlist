import { describe, expect, it } from 'vitest'
import {
  INSTALL_DISMISSED_KEY,
  isIOSSafari,
  rememberInstallDismissed,
  shouldOfferInstall,
  wasInstallDismissed,
} from './install.js'

const UA = {
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36',
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
}

function fakeWindow({ standalone = false, wide = false, iosStandalone = undefined } = {}) {
  return {
    matchMedia: (q) => ({
      matches: q === '(display-mode: standalone)' ? standalone : q === '(min-width: 768px)' ? wide : false,
    }),
    navigator: { standalone: iosStandalone },
  }
}

function memoryStorage() {
  const data = new Map()
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) }
}

const blockedStorage = {
  getItem() {
    throw new Error('blocked')
  },
  setItem() {
    throw new Error('blocked')
  },
}

describe('isIOSSafari', () => {
  it('is true only for Safari on iOS', () => {
    expect(isIOSSafari(UA.iphoneSafari)).toBe(true)
    expect(isIOSSafari(UA.iphoneChrome)).toBe(false)
    expect(isIOSSafari(UA.androidChrome)).toBe(false)
    expect(isIOSSafari(UA.macSafari)).toBe(false)
  })
})

describe('shouldOfferInstall', () => {
  it('offers on a phone-width browser tab', () => {
    expect(shouldOfferInstall(fakeWindow())).toBe(true)
  })

  it('does not offer on wide screens', () => {
    expect(shouldOfferInstall(fakeWindow({ wide: true }))).toBe(false)
  })

  it('does not offer inside the installed app', () => {
    expect(shouldOfferInstall(fakeWindow({ standalone: true }))).toBe(false)
    expect(shouldOfferInstall(fakeWindow({ iosStandalone: true }))).toBe(false)
  })
})

describe('install dismissal', () => {
  it('is remembered in storage', () => {
    const storage = memoryStorage()
    expect(wasInstallDismissed(storage)).toBe(false)
    rememberInstallDismissed(storage)
    expect(storage.getItem(INSTALL_DISMISSED_KEY)).toBe('1')
    expect(wasInstallDismissed(storage)).toBe(true)
  })

  it('tolerates blocked storage', () => {
    expect(wasInstallDismissed(blockedStorage)).toBe(false)
    expect(() => rememberInstallDismissed(blockedStorage)).not.toThrow()
  })
})
