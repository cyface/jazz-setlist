import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import PreferencesPage from './PreferencesPage.svelte'
import Topbar from '../components/Topbar.svelte'
import { api } from '../lib/api.js'
import { THEME_STORAGE_KEY } from '../../shared/theme.js'

vi.mock('../lib/api.js', () => ({ api: { savePreferences: vi.fn() } }))

const html = document.documentElement

describe('PreferencesPage theme', () => {
  it('applies a theme as soon as it is picked, on this device, without saving preferences', async () => {
    const screen = await render(PreferencesPage)
    await expect.element(screen.getByRole('radio', { name: 'Match system' })).toBeChecked()

    await screen.getByText('Dark', { exact: true }).click()
    await expect.poll(() => html.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    await screen.getByText('Light', { exact: true }).click()
    await expect.poll(() => html.dataset.theme).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')

    await screen.getByText('Match system').click()
    await expect.poll(() => html.dataset.theme).toBeUndefined()
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()

    // Not a preference: Save stays disabled and nothing is sent.
    await expect.element(screen.getByRole('button', { name: 'Save preferences' })).toBeDisabled()
    expect(api.savePreferences).not.toHaveBeenCalled()
  })

  it('opens with the theme chosen on this device selected', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    const screen = await render(PreferencesPage)
    await expect.element(screen.getByRole('radio', { name: 'Dark' })).toBeChecked()
    await expect.element(screen.getByRole('radio', { name: 'Match system' })).not.toBeChecked()
  })
})

describe('Topbar', () => {
  it('has no theme button (the theme is in Preferences)', async () => {
    const screen = await render(Topbar, { sidebarOpen: false, ontogglesidebar: () => {} })
    await expect.element(screen.getByRole('button', { name: 'Account menu' })).toBeVisible()
    expect(screen.getByRole('button', { name: /theme/i }).elements()).toHaveLength(0)
  })
})
