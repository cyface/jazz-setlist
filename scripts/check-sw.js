// Fails the build if the service worker would keep serving an old app.js or
// app.css. Those names never change, so each needs a precache revision; that
// revision is also what makes sw.js change (and update) on every release.
import { readFileSync } from 'node:fs'

const sw = readFileSync(new URL('../dist/client/sw.js', import.meta.url), 'utf8')
const problems = ['assets/app.js', 'assets/app.css'].filter(
  (url) => !new RegExp(`\\{url:"${url}",revision:"[0-9a-f]+"\\}`).test(sw),
)
if (problems.length) {
  console.error(`sw.js precaches ${problems.join(' and ')} without a revision; clients would never get a new version.`)
  process.exit(1)
}
console.log('sw.js: app.js and app.css have precache revisions')
