import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import SetlistPage from './SetlistPage.svelte'
import { api } from '../lib/api.js'
import { connection } from '../lib/connection.svelte.js'
import { AUTUMN_LEAVES, BLUE_BOSSA, breakItem, setlist, SO_WHAT, SUNNY, tuneItem } from '../test/fixtures.js'

vi.mock('../lib/api.js', () => ({
  api: { getSetlist: vi.fn(), listArrangements: vi.fn(), saveSetlistItems: vi.fn() },
}))

// Set 1: Blue Bossa, So What · break · Set 2: Autumn Leaves, Blue Bossa (again), Sunny
const GIG = setlist([
  tuneItem(BLUE_BOSSA),
  tuneItem(SO_WHAT),
  breakItem('20 min'),
  tuneItem(AUTUMN_LEAVES),
  tuneItem(BLUE_BOSSA),
  tuneItem(SUNNY),
])
const notFound = () => Object.assign(new Error('Not found'), { status: 404 })

beforeEach(() => {
  vi.mocked(api.getSetlist).mockReset().mockResolvedValue(GIG)
  vi.mocked(api.listArrangements).mockReset().mockResolvedValue([BLUE_BOSSA, SO_WHAT, AUTUMN_LEAVES, SUNNY])
  vi.mocked(api.saveSetlistItems).mockReset().mockResolvedValue(GIG)
})

const detail = (screen) => screen.getByRole('article')

describe('SetlistPage', () => {
  it('opens a tune in setlist mode: set and tune number, Next with the next set, an Edit link back to it', async () => {
    const screen = await render(SetlistPage, { id: 's1' })
    await screen.getByRole('button', { name: /So What/ }).click()

    await expect.element(detail(screen).getByText('Set 1 · Tune 2')).toBeVisible()
    await expect.element(detail(screen).getByRole('heading', { name: 'So What' })).toBeVisible()
    await expect.element(screen.getByRole('button', { name: /Next \(set 2\): Autumn Leaves/ })).toBeVisible()
    await expect
      .element(detail(screen).getByRole('link', { name: 'Edit' }))
      .toHaveAttribute('href', `#/arrangements/${SO_WHAT.id}/edit?setlist=s1&tune=1`)
    await expect.element(screen.getByRole('button', { name: 'Prev' })).toBeEnabled()
    await screen.getByRole('button', { name: 'Prev' }).click()
    await expect.element(detail(screen).getByText('Set 1 · Tune 1')).toBeVisible()
    await expect.element(screen.getByRole('button', { name: 'Prev' })).toBeDisabled()
  })

  it('reopens the tune it was asked to (back from editing it), the right copy of a repeated tune, then drops the request from the URL', async () => {
    history.replaceState(null, '', `#/setlists/s1?tune=3&arrangement=${BLUE_BOSSA.id}`)
    const screen = await render(SetlistPage, { id: 's1', open: { index: 3, arrangementId: BLUE_BOSSA.id } })

    await expect.element(detail(screen).getByText('Set 2 · Tune 2')).toBeVisible()
    expect(location.hash).toBe('#/setlists/s1')
  })

  it('finds a reopened tune that moved since', async () => {
    const screen = await render(SetlistPage, { id: 's1', open: { index: 0, arrangementId: SUNNY.id } })
    await expect.element(detail(screen).getByText('Set 2 · Tune 3')).toBeVisible()
  })

  it('shows the tune page instead when the tune is no longer in the setlist', async () => {
    const before = history.length
    await render(SetlistPage, { id: 's1', open: { index: 1, arrangementId: 'a-gone' } })
    await expect.poll(() => location.hash).toBe('#/arrangements/a-gone')
    expect(history.length).toBe(before) // replaced, so Back doesn't come here again
  })

  it('shows the tune page instead when the setlist is gone', async () => {
    vi.mocked(api.getSetlist).mockRejectedValue(notFound())
    await render(SetlistPage, { id: 's1', open: { index: 1, arrangementId: SO_WHAT.id } })
    await expect.poll(() => location.hash).toBe(`#/arrangements/${SO_WHAT.id}`)
  })

  it('reports a missing setlist when not coming back from an edit', async () => {
    vi.mocked(api.getSetlist).mockRejectedValue(notFound())
    const screen = await render(SetlistPage, { id: 's1' })
    await expect.element(screen.getByText('Not found')).toBeVisible()
    expect(location.hash).toBe('')
  })

  it('shows row controls and break-note inputs only in edit mode', async () => {
    const screen = await render(SetlistPage, { id: 's1' })
    await expect.element(screen.getByText('20 min')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Move up' }).elements()).toHaveLength(0)

    await screen.getByRole('button', { name: 'Edit' }).click()
    await expect.poll(() => screen.getByRole('button', { name: 'Move up' }).elements()).toHaveLength(6)
    await expect.element(screen.getByRole('textbox', { name: 'Set break note' })).toHaveValue('20 min')

    await screen.getByRole('button', { name: 'Done' }).click()
    expect(screen.getByRole('button', { name: 'Move up' }).elements()).toHaveLength(0)
  })

  it('saves the new order when a tune is moved', async () => {
    const screen = await render(SetlistPage, { id: 's1' })
    await screen.getByRole('button', { name: 'Edit' }).click()
    await screen.getByRole('button', { name: 'Move down' }).first().click()

    await expect.poll(() => api.saveSetlistItems.mock.calls.length).toBe(1)
    const [, items] = api.saveSetlistItems.mock.calls[0]
    expect(items.slice(0, 2)).toEqual([
      { kind: 'tune', arrangementId: SO_WHAT.id },
      { kind: 'tune', arrangementId: BLUE_BOSSA.id },
    ])
  })

  it('offline, shows the saved copy without edit controls, and reloads when back online keeping the open tune', async () => {
    connection.offline = true
    vi.mocked(api.getSetlist).mockResolvedValue({ ...GIG, savedAt: '2026-11-14T18:30:00Z' })
    const screen = await render(SetlistPage, { id: 's1' })

    await expect.element(screen.getByText(/Saved copy from/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Edit' }).elements()).toHaveLength(0)
    expect(screen.getByRole('button', { name: /Add set break/ }).elements()).toHaveLength(0)
    await screen.getByRole('button', { name: /Autumn Leaves/ }).click()
    expect(detail(screen).getByRole('link', { name: 'Edit' }).elements()).toHaveLength(0)

    vi.mocked(api.getSetlist).mockResolvedValue(GIG)
    connection.offline = false
    await expect.poll(() => api.getSetlist.mock.calls.length).toBe(2)
    await expect.element(screen.getByText(/Saved copy from/)).not.toBeInTheDocument()
    await expect.element(detail(screen).getByText('Set 2 · Tune 1')).toBeVisible()
  })
})
