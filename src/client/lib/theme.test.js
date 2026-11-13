import { describe, expect, it } from 'vitest'
import { THEME_BOOT_SCRIPT, THEME_STORAGE_KEY, nextTheme } from '../../shared/theme.js'
import { applyTheme, readTheme } from './theme.js'

function memoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => (data[k] = v),
    removeItem: (k) => delete data[k],
  }
}

describe('theme', () => {
  it('cycles system → dark → light → system', () => {
    expect(nextTheme('system')).toBe('dark')
    expect(nextTheme('dark')).toBe('light')
    expect(nextTheme('light')).toBe('system')
  })

  it('reads a saved theme and ignores junk', () => {
    expect(readTheme(memoryStorage({ [THEME_STORAGE_KEY]: 'dark' }))).toBe('dark')
    expect(readTheme(memoryStorage({ [THEME_STORAGE_KEY]: 'purple' }))).toBe('system')
    expect(readTheme({ getItem: () => { throw new Error('blocked') } })).toBe('system')
  })

  it('sets data-theme for an explicit choice and clears it for system', () => {
    const root = { dataset: {} }
    const storage = memoryStorage()
    applyTheme('light', root, storage)
    expect(root.dataset.theme).toBe('light')
    expect(storage.data[THEME_STORAGE_KEY]).toBe('light')
    applyTheme('system', root, storage)
    expect(root.dataset.theme).toBeUndefined()
    expect(storage.data).toEqual({})
  })

  it('boot script applies the saved theme', () => {
    const document = { documentElement: { dataset: {} } }
    const localStorage = memoryStorage({ [THEME_STORAGE_KEY]: 'dark' })
    new Function('document', 'localStorage', THEME_BOOT_SCRIPT)(document, localStorage)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
