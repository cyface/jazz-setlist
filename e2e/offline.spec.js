import { expect, test } from './fixtures.js'

test('offline, the setlist comes from the saved copy without edit controls; back online it reloads', async ({ page, context, gig }) => {
  // Online first: opening the app saves the active setlists on the device.
  await page.goto(`/#/setlists/${gig.setlist.id}`)
  await expect(page.getByRole('heading', { name: 'Winter Gig', level: 1 })).toBeVisible()
  await expect.poll(() => page.evaluate(() => Boolean(JSON.parse(localStorage.getItem('offline-copy'))?.setlists))).toBe(true)

  await context.setOffline(true)
  // Leave and come back within the app (there's no service worker in dev to reload the page offline).
  await page.getByRole('link', { name: 'Setlists' }).first().click()
  await page.getByRole('link', { name: /Winter Gig/ }).click()

  await expect(page.getByRole('status').filter({ hasText: 'Offline' })).toBeVisible()
  await expect(page.getByText(/Saved copy from/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Add set break/ })).toHaveCount(0)

  await page.getByRole('button', { name: /Blue Bossa/ }).click()
  const detail = page.getByRole('article')
  await expect(detail.getByText('150', { exact: true })).toBeVisible()
  await expect(detail.getByRole('link', { name: 'Edit' })).toHaveCount(0)

  await context.setOffline(false)
  await expect(page.getByRole('status').filter({ hasText: 'Offline' })).toHaveCount(0)
  await expect(page.getByText(/Saved copy from/)).toHaveCount(0)
  await expect(detail.getByRole('heading', { name: 'Blue Bossa' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
})
