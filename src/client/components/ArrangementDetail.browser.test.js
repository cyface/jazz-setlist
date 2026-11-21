import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import ArrangementDetail from './ArrangementDetail.svelte'
import { connection } from '../lib/connection.svelte.js'
import { SO_WHAT, document } from '../test/fixtures.js'

const SHEET = document(SO_WHAT.id, 'so what.png')
const CHART = document(SO_WHAT.id, 'chart.pdf', { type: 'arrangement', contentType: 'application/pdf', size: 3.4 * 1024 * 1024 })
const fileUrl = (doc) => `/api/arrangements/${SO_WHAT.id}/documents/${doc.id}/file`

describe('ArrangementDetail documents', () => {
  it('shows an image document on the page and links other files, each with its type', async () => {
    const screen = await render(ArrangementDetail, { arrangement: { ...SO_WHAT, documents: [SHEET, CHART] } })

    await expect.element(screen.getByRole('heading', { name: 'Documents' })).toBeVisible()
    const image = screen.getByRole('img', { name: 'Lead sheet: so what.png' })
    await expect.element(image).toHaveAttribute('src', fileUrl(SHEET))
    await expect.element(screen.getByRole('link', { name: 'Lead sheet: so what.png' })).toHaveAttribute('href', fileUrl(SHEET))

    const file = screen.getByRole('link', { name: /chart\.pdf\s+Arrangement\s+·\s+3\.4 MB/ })
    await expect.element(file).toHaveAttribute('href', fileUrl(CHART))
  })

  it('has no Documents section for a tune without any, or one saved before documents existed', async () => {
    const { documents: _documents, ...older } = SO_WHAT
    for (const arrangement of [SO_WHAT, older]) {
      const screen = await render(ArrangementDetail, { arrangement })
      await expect.element(screen.getByRole('heading', { name: 'So What' })).toBeVisible()
      await expect.element(screen.getByRole('heading', { name: 'Documents' })).not.toBeInTheDocument()
      screen.unmount()
    }
  })

  it('says offline that a document may not show', async () => {
    connection.offline = true
    const screen = await render(ArrangementDetail, { arrangement: { ...SO_WHAT, documents: [SHEET] } })
    await expect.element(screen.getByText(/You're offline/)).toBeVisible()
  })
})
