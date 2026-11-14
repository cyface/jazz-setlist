import { rmSync } from 'node:fs'

// The pwa project's server puts the e2e test user in the build's .dev.vars (read only by local preview); take it out
// again, so a later `pnpm preview` doesn't sign in as that user.
export default function teardown() {
  rmSync(new URL('../dist/jazz_setlist/.dev.vars', import.meta.url), { force: true })
}
