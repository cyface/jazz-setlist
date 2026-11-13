import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Miniflare } from 'miniflare'
import { app } from './index.jsx'

const MIGRATIONS_DIR = join(import.meta.dirname, '../../drizzle')

/** In-memory D1 (real SQLite semantics via Miniflare) with all migrations applied. */
export async function createTestEnv() {
  const mf = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response(null) } }',
    d1Databases: { DB: 'test-db' },
  })
  const DB = await mf.getD1Database('DB')
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort()
  for (const file of files) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8')
    for (const statement of sql.split('--> statement-breakpoint')) {
      if (statement.trim()) await DB.prepare(statement).run()
    }
  }
  const env = { DB }

  function api(email, method, path, body) {
    const headers = { 'CF-Access-Authenticated-User-Email': email }
    if (body !== undefined) headers['content-type'] = 'application/json'
    return app.request(
      `http://jazz.test/api${path}`,
      { method, headers, body: body === undefined ? undefined : JSON.stringify(body) },
      env,
    )
  }

  return { env, api, dispose: () => mf.dispose() }
}

export const sampleArrangement = (overrides = {}) => ({
  title: 'Autumn Leaves',
  composer: 'Joseph Kosma',
  musicalKey: 'Gm',
  tempo: 160,
  beatsPerBar: 4,
  feel: 'swing',
  drumImplement: 'brushes',
  drumsEntry: 'later',
  drumsEntryNote: 'Bridge of first chorus',
  soloOrder: [
    { type: 'solo', instrument: 'piano' },
    { type: 'trade', instruments: ['drums', 'bass'], bars: 4 },
    { type: 'over_head', instrument: 'drums' },
  ],
  notes: null,
  ...overrides,
})
