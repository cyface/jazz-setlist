import { expect, test } from './fixtures.js'

/** Loads `path` and waits until the service worker controls the page (a first visit installs it; it claims the page). */
async function underServiceWorker(page, path) {
  await page.goto(path)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
}

test('the service worker installs, precaches the app and controls the page', async ({ page }) => {
  await underServiceWorker(page, '/')
  const precached = await page.evaluate(async () => {
    const urls = []
    for (const name of await caches.keys()) for (const req of await (await caches.open(name)).keys()) urls.push(new URL(req.url).pathname)
    return urls
  })
  expect(precached).toEqual(expect.arrayContaining(['/assets/app.js', '/assets/app.css', '/manifest.webmanifest']))
})

test('the app loads app.js?v=<version> from the precache', async ({ page }) => {
  await underServiceWorker(page, '/')
  const appJs = page.waitForResponse((r) => new URL(r.url()).pathname === '/assets/app.js')
  await page.reload()
  const response = await appJs
  expect(new URL(response.url()).searchParams.get('v')).toMatch(/^\d+\.\d+\.\d+$/)
  expect(response.fromServiceWorker()).toBe(true)
})

test('online, a navigation still goes to the network (so an expired sign-in redirects to the login)', async ({ page, context }) => {
  await underServiceWorker(page, '/')
  const shellRequests = []
  context.on('request', (r) => r.serviceWorker() && new URL(r.url()).pathname === '/' && shellRequests.push(r.url()))
  await page.reload()
  await expect(page.getByRole('link', { name: 'Tunes' }).first()).toBeVisible()
  expect(shellRequests.length).toBeGreaterThan(0)
})

test('offline, a reload shows the app from the cache with the saved setlist', async ({ page, context, gig }) => {
  await underServiceWorker(page, `/#/setlists/${gig.setlist.id}`)
  // Under the worker, a navigation online puts the shell in its cache; opening the app saved the setlist.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Winter Gig', level: 1 })).toBeVisible()
  await expect.poll(() => page.evaluate(() => Boolean(JSON.parse(localStorage.getItem('offline-copy'))?.setlists))).toBe(true)

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Winter Gig', level: 1 })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Offline' })).toBeVisible()
  await expect(page.getByText(/Saved copy from/)).toBeVisible()
  await page.getByRole('button', { name: /Blue Bossa/ }).click()
  await expect(page.getByRole('article').getByRole('heading', { name: 'Blue Bossa' })).toBeVisible()
  await context.setOffline(false)
})

/** The app opened while the worker already controls it (any visit after the first), as when a release lands. */
async function openUnderServiceWorker(page, path) {
  await underServiceWorker(page, path)
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
}

/**
 * A new release's worker taking over the page (it skips waiting and claims clients; scripts/check-sw.js checks the
 * build does both). Shipping a real second worker isn't possible here: `vite preview` fixes each file's ETag at
 * startup, so a changed sw.js is still answered 304 and the browser never sees the update, and Playwright's routing
 * doesn't see the browser's fetch of a worker script. So this fires the event the browser fires at that point.
 */
const newWorkerTakesOver = (page) => page.evaluate(() => navigator.serviceWorker.dispatchEvent(new Event('controllerchange')))
/** Something that a reload clears. */
const markPage = (page) => page.evaluate(() => (window.__notReloaded = true))
/** Whether the page was reloaded since markPage(); false while a reload is still under way, so polls try again. */
const reloaded = (page) => page.evaluate(() => !window.__notReloaded).catch(() => false)

test('when a new release takes over, the open app reloads once to run it', async ({ page }) => {
  await openUnderServiceWorker(page, '/')
  await markPage(page)

  await newWorkerTakesOver(page)
  await expect.poll(() => reloaded(page)).toBe(true)
  await expect(page.getByRole('link', { name: 'Tunes' }).first()).toBeVisible()
})

test('a first install taking over the page does not reload it', async ({ page }) => {
  await page.goto('/')
  await markPage(page)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  await page.waitForTimeout(500)
  expect(await reloaded(page)).toBe(false)
})

test('the reload for a new release waits while the metronome plays', async ({ page, gig }) => {
  await openUnderServiceWorker(page, `/#/setlists/${gig.setlist.id}`)
  await page.getByRole('button', { name: /Blue Bossa/ }).click()
  await page.getByRole('button', { name: 'Start metronome' }).click()
  await expect(page.getByRole('button', { name: 'Stop metronome' })).toBeVisible()
  await markPage(page)

  await newWorkerTakesOver(page)
  await page.waitForTimeout(1000)
  expect(await reloaded(page)).toBe(false) // not mid-song

  await page.getByRole('button', { name: 'Stop metronome' }).click()
  await expect.poll(() => reloaded(page)).toBe(true)
  // Reloaded back to the same setlist.
  await expect(page.getByRole('heading', { name: 'Winter Gig', level: 1 })).toBeVisible()
})

test('a document opened in its own tab is not kept in the service worker cache', async ({ page, data }) => {
  const tune = await data.tune('Documented')
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
  const upload = await page.request.post(`/api/arrangements/${tune.id}/documents`, {
    multipart: { type: 'lead_sheet', file: { name: 'sheet.png', mimeType: 'image/png', buffer: png } },
  })
  expect(upload.status()).toBe(201)
  const [doc] = (await upload.json()).arrangement.documents

  await underServiceWorker(page, '/')
  // Opening the file is a navigation, like the app's own pages, which the worker caches for offline use.
  const file = await page.goto(`/api/arrangements/${tune.id}/documents/${doc.id}/file`)
  expect(file.status()).toBe(200)
  await page.goto('/')
  const cached = await page.evaluate(async () => {
    const urls = []
    for (const name of await caches.keys()) for (const req of await (await caches.open(name)).keys()) urls.push(new URL(req.url).pathname)
    return urls
  })
  expect(cached.filter((path) => path.startsWith('/api/'))).toEqual([])
})
