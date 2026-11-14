import { devices } from '@playwright/test'
import { expect, test } from './fixtures.js'

test.use({ ...devices['Pixel 7'] })

/** Holds a finger on `locator` for `ms` (Chromium touch events, as a phone sends them). */
async function longPress(page, locator, ms = 700) {
  const box = await locator.boundingBox()
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
  await page.waitForTimeout(ms)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

test('holding a tune adds it to the active setlist', async ({ page, gig, data }) => {
  await data.tune('Watermelon Man', { tempo: 128, feel: 'latin' })
  await page.goto('/')

  await longPress(page, page.getByRole('link', { name: /Watermelon Man/ }))
  const menu = page.getByRole('dialog', { name: 'Watermelon Man' })
  await expect(menu).toBeVisible()
  // The finger lifting didn't pick anything or navigate.
  await expect(page).toHaveURL(/#\/$|\/$/)
  await menu.getByRole('button', { name: /Add to Winter Gig/ }).click()

  await expect(page.getByRole('status').getByText(/Added/)).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Active setlists' }).getByText('5 tunes')).toBeVisible()

  await page.goto(`/#/setlists/${gig.setlist.id}`)
  await expect(page.getByRole('button', { name: /Watermelon Man/ })).toBeVisible()
})

for (const scheme of ['light', 'dark']) {
  test(`fits a 320px phone in ${scheme} mode without sideways scrolling`, async ({ page, gig }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.emulateMedia({ colorScheme: scheme })
    const noSidewaysScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)

    await page.goto('/')
    await expect(page.getByRole('link', { name: /Blue Bossa/ })).toBeVisible()
    expect(await noSidewaysScroll()).toBe(true)

    await page.goto(`/#/setlists/${gig.setlist.id}`)
    await page.getByRole('button', { name: 'Edit' }).click()
    await expect(page.getByRole('textbox', { name: 'Set break note' })).toBeVisible()
    expect(await noSidewaysScroll()).toBe(true)
    await page.getByRole('button', { name: 'Done' }).click()

    await page.getByRole('button', { name: /So What/ }).click()
    await expect(page.getByRole('article').getByRole('heading', { name: 'So What' })).toBeVisible()
    expect(await noSidewaysScroll()).toBe(true)

    await page.getByRole('article').getByRole('link', { name: 'Edit' }).click()
    await expect(page.getByRole('heading', { name: 'Edit tune' })).toBeVisible()
    expect(await noSidewaysScroll()).toBe(true)

    // The theme really is applied: the page background follows the scheme.
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    const [r, g, b] = bg.match(/\d+/g).map(Number)
    expect((r + g + b) / 3 > 128).toBe(scheme === 'light')
  })
}
