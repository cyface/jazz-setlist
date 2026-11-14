import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import ActiveSetlists from './ActiveSetlists.svelte'
import { api } from '../lib/api.js'

vi.mock('../lib/api.js', () => ({ api: { listSetlists: vi.fn() } }))

const row = (id, name, extra = {}) => ({ id, name, showDate: null, venue: null, archivedAt: null, tuneCount: 2, ...extra })

describe('ActiveSetlists', () => {
  it('links each active setlist with its date, venue and tune count, leaving out archived ones', async () => {
    vi.mocked(api.listSetlists).mockResolvedValue([
      row('s1', 'Winter Gig', { showDate: '2026-12-05', venue: 'The Blue Room', tuneCount: 1 }),
      row('s0', 'Old Gig', { archivedAt: '2026-01-01T00:00:00Z' }),
    ])
    const screen = await render(ActiveSetlists)

    const link = screen.getByRole('link', { name: /Winter Gig/ })
    await expect.element(link).toHaveAttribute('href', '#/setlists/s1')
    await expect.element(link.getByText('Sat, Dec 5, 2026 · The Blue Room')).toBeVisible()
    await expect.element(link.getByText('1 tune', { exact: true })).toBeVisible()
    expect(screen.getByRole('link', { name: /Old Gig/ }).elements()).toHaveLength(0)
  })

  it('shows nothing when every setlist is archived', async () => {
    vi.mocked(api.listSetlists).mockResolvedValue([row('s0', 'Old Gig', { archivedAt: '2026-01-01T00:00:00Z' })])
    const screen = await render(ActiveSetlists)
    await vi.waitFor(() => expect(api.listSetlists).toHaveBeenCalled())
    expect(screen.getByRole('navigation').elements()).toHaveLength(0)
  })

  it('shows nothing when the list fails to load (the tune list below reports errors)', async () => {
    let failed
    vi.mocked(api.listSetlists).mockImplementation(
      () => (failed = new Promise((resolve, reject) => setTimeout(() => reject(new Error('offline'))))),
    )
    const screen = await render(ActiveSetlists)
    await failed.catch(() => {})
    expect(screen.getByRole('navigation').elements()).toHaveLength(0)
  })

  it('keeps the tune count current after a tune is added from the Tunes page', async () => {
    vi.mocked(api.listSetlists).mockResolvedValue([row('s1', 'Winter Gig', { tuneCount: 2 })])
    const screen = await render(ActiveSetlists)
    await expect.element(screen.getByText('2 tunes', { exact: true })).toBeVisible()

    screen.component.update({ id: 's1', name: 'Winter Gig', showDate: null, venue: null, items: [{ kind: 'tune' }, { kind: 'break' }, { kind: 'tune' }, { kind: 'tune' }] })
    await expect.element(screen.getByText('3 tunes', { exact: true })).toBeVisible()
  })
})
