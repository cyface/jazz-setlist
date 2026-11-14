// Fails the build if the service worker would keep serving an old app.js or app.css, or wouldn't take over open
// pages. app.js and app.css never change names, so each needs a precache revision; that revision is also what makes
// sw.js change (and update) on every release. The worker must skip waiting and claim clients, or a new release waits
// until every window of the app is closed (main.js's controllerchange reload never runs) and a first install doesn't
// control the page until a reload (so it isn't offline-ready). e2e/pwa.spec.js tests the rest in a browser.
import { readFileSync } from 'node:fs'

const sw = readFileSync(new URL('../dist/client/sw.js', import.meta.url), 'utf8')
const problems = ['assets/app.js', 'assets/app.css']
  .filter((url) => !new RegExp(`\\{url:"${url}",revision:"[0-9a-f]+"\\}`).test(sw))
  .map((url) => `precaches ${url} without a revision; clients would never get a new version`)
// Without skipWaiting, workbox generates a handler that skips waiting only when the page posts SKIP_WAITING (main.js
// never does), so its self.skipWaiting() doesn't count. With the option on, that handler isn't generated.
if (!/self\.skipWaiting\(\)/.test(sw) || sw.includes('SKIP_WAITING')) {
  problems.push("doesn't skip waiting; a new release would wait for every window of the app to close")
}
if (!/\bclientsClaim\(\)/.test(sw)) problems.push("doesn't claim clients; a first visit wouldn't work offline until a reload")
if (problems.length) {
  console.error(problems.map((p) => `sw.js ${p}.`).join('\n'))
  process.exit(1)
}
console.log('sw.js: app.js and app.css have precache revisions; skips waiting and claims clients')
