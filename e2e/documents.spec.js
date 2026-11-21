import { expect, test } from './fixtures.js'

// A 1×1 PNG: enough for the browser to decode what the Worker stored in (local) R2 and served back.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

test.describe('tune documents', () => {
  test('a lead sheet photo added on the tune form shows on the tune and in the setlist, until it is removed', async ({ page, gig, data }) => {
    const tune = gig.tunes.soWhat
    await page.goto(`/#/arrangements/${tune.id}/edit`)
    await page.getByTestId('document-files').setInputFiles({ name: 'so what.png', mimeType: 'image/png', buffer: PNG })
    await expect(page.getByRole('link', { name: 'so what.png' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Type of so what.png' })).toHaveValue('lead_sheet')

    // Saved without the form's Save: Cancel still leaves it on the tune.
    await page.getByRole('link', { name: 'Cancel' }).click()
    const image = page.getByRole('article').getByRole('img', { name: 'Lead sheet: so what.png' })
    await expect(image).toBeVisible()
    await expect.poll(() => image.evaluate((img) => img.naturalWidth)).toBe(1)

    await page.goto(`/#/setlists/${gig.setlist.id}`)
    await page.getByRole('button', { name: /So What/ }).click()
    await expect(image).toBeVisible()

    const [doc] = (await data.getTune(tune.id)).documents
    page.on('dialog', (dialog) => dialog.accept())
    await page.goto(`/#/arrangements/${tune.id}/edit`)
    await page.getByRole('button', { name: 'Remove so what.png' }).click()
    await expect(page.getByRole('link', { name: 'so what.png' })).not.toBeVisible()
    expect((await data.getTune(tune.id)).documents).toEqual([])
    expect((await page.request.get(`/api/arrangements/${tune.id}/documents/${doc.id}/file`)).status()).toBe(404)
  })
})
