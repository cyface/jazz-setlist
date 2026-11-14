import { expect, test } from './fixtures.js'

test.describe('at the gig', () => {
  test('the Tunes page links the active setlist, which opens in setlist mode', async ({ page, gig, data }) => {
    await data.archive((await data.setlist('Last Year')).id)
    await page.goto('/')

    const shortcuts = page.getByRole('navigation', { name: 'Active setlists' })
    await expect(shortcuts.getByRole('link')).toHaveCount(1)
    await shortcuts.getByRole('link', { name: /Winter Gig/ }).click()

    await expect(page).toHaveURL(new RegExp(`#/setlists/${gig.setlist.id}$`))
    await expect(page.getByRole('heading', { name: 'Winter Gig', level: 1 })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Set break' })).toBeVisible()
    await expect(page.getByText('20 min')).toBeVisible()
  })

  test('steps through the tunes and keeps the last one highlighted back in the list', async ({ page, gig }) => {
    await page.goto(`/#/setlists/${gig.setlist.id}`)
    await page.getByRole('button', { name: /So What/ }).click()

    const detail = page.getByRole('article')
    await expect(detail.getByText('Set 1 · Tune 2')).toBeVisible()
    await page.getByRole('button', { name: /Next \(set 2\): Autumn Leaves/ }).click()
    await expect(detail.getByRole('heading', { name: 'Autumn Leaves' })).toBeVisible()
    await expect(detail.getByText('Set 2 · Tune 1')).toBeVisible()
    await page.getByRole('button', { name: 'Prev' }).click()
    await expect(detail.getByRole('heading', { name: 'So What' })).toBeVisible()

    // Last tune: no Next.
    await page.getByRole('button', { name: /Sunny/ }).click()
    await expect(page.getByRole('button', { name: /Last tune/ })).toBeDisabled()

    await page.getByRole('button', { name: 'Setlist', exact: true }).click()
    await expect(page.getByRole('button', { name: /Sunny/ })).toHaveAttribute('aria-current', 'true')
  })

  test('editing a tune from the setlist comes back to it there, with the change', async ({ page, gig, data }) => {
    await page.goto(`/#/setlists/${gig.setlist.id}`)
    await page.getByRole('button', { name: /Autumn Leaves/ }).click()
    await page.getByRole('article').getByRole('link', { name: 'Edit' }).click()

    await expect(page.getByRole('heading', { name: 'Edit tune' })).toBeVisible()
    await page.getByRole('spinbutton', { name: /Tempo/ }).fill('172')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page).toHaveURL(new RegExp(`#/setlists/${gig.setlist.id}$`))
    const detail = page.getByRole('article')
    await expect(detail.getByText('Set 2 · Tune 1')).toBeVisible()
    await expect(detail.getByText('172', { exact: true })).toBeVisible()
    expect((await data.getTune(gig.tunes.autumn.id)).tempo).toBe(172)

    // Back skips the form.
    await page.goBack()
    await expect(page.getByRole('heading', { name: 'Edit tune' })).not.toBeVisible()
  })

  test('reopening the app without a route goes back to the last page', async ({ page, gig }) => {
    await page.goto(`/#/setlists/${gig.setlist.id}`)
    await expect(page.getByRole('heading', { name: 'Winter Gig', level: 1 })).toBeVisible()

    await page.goto('/')
    await expect(page).toHaveURL(new RegExp(`#/setlists/${gig.setlist.id}$`))
    await expect(page.getByRole('heading', { name: 'Winter Gig', level: 1 })).toBeVisible()
  })
})
