import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import ArrangementEditPage from './ArrangementEditPage.svelte'
import { api } from '../lib/api.js'
import { SO_WHAT } from '../test/fixtures.js'

vi.mock('../lib/api.js', () => ({
  api: { getArrangement: vi.fn(), updateArrangement: vi.fn(), createArrangement: vi.fn(), deleteArrangement: vi.fn() },
}))

const FROM = { setlistId: 's1', index: 1 }

beforeEach(() => {
  vi.mocked(api.getArrangement).mockReset().mockResolvedValue(SO_WHAT)
  vi.mocked(api.updateArrangement).mockReset().mockImplementation(async (id, data) => ({ ...SO_WHAT, ...data, id }))
  history.replaceState(null, '', `#/arrangements/${SO_WHAT.id}/edit`)
})

describe('ArrangementEditPage leaving the form', () => {
  it('Cancel goes back to the tune open in the setlist it came from, without leaving the form in history', async () => {
    const before = history.length
    const screen = await render(ArrangementEditPage, { id: SO_WHAT.id, from: FROM })
    await screen.getByRole('link', { name: 'Cancel' }).click()

    expect(location.hash).toBe(`#/setlists/s1?tune=1&arrangement=${SO_WHAT.id}`)
    expect(history.length).toBe(before)
  })

  it('Save goes back to the tune open in the setlist, after saving', async () => {
    const before = history.length
    const screen = await render(ArrangementEditPage, { id: SO_WHAT.id, from: FROM })
    await screen.getByRole('spinbutton', { name: /Tempo \(bpm\)/ }).fill('140')
    await screen.getByRole('button', { name: 'Save' }).click()

    await expect.poll(() => location.hash).toBe(`#/setlists/s1?tune=1&arrangement=${SO_WHAT.id}`)
    expect(api.updateArrangement).toHaveBeenCalledWith(SO_WHAT.id, expect.objectContaining({ tempo: 140 }))
    expect(history.length).toBe(before)
  })

  it('without a setlist, Save and Cancel go to the tune', async () => {
    const before = history.length
    const screen = await render(ArrangementEditPage, { id: SO_WHAT.id })
    await expect.element(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', `#/arrangements/${SO_WHAT.id}`)
    await screen.getByRole('button', { name: 'Save' }).click()
    await expect.poll(() => location.hash).toBe(`#/arrangements/${SO_WHAT.id}`)
    expect(history.length).toBe(before)
  })

  it('stays on the form and shows the error when saving fails', async () => {
    vi.mocked(api.updateArrangement).mockRejectedValue(new Error('tempo: Too big'))
    const screen = await render(ArrangementEditPage, { id: SO_WHAT.id, from: FROM })
    await screen.getByRole('button', { name: 'Save' }).click()

    await expect.element(screen.getByText('tempo: Too big')).toBeVisible()
    expect(location.hash).toBe(`#/arrangements/${SO_WHAT.id}/edit`)
  })
})
