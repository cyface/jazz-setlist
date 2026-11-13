// import.json (from transform.py) -> SQL for `wrangler d1 execute --file`, validated with the app's own Zod schemas.
// Rerunnable: a tune whose title already exists for the user (case-insensitive) is not inserted again and setlists
// link to the existing one; a setlist whose name already exists is skipped along with its items.
//
// usage: node scripts/polynome/to-sql.js import.json out.sql <user email>
import { readFileSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { arrangementInputSchema, setlistInputSchema, setlistItemsSchema } from '../../src/shared/validation.js'

const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replaceAll("'", "''")}'`)

/**
 * @param {{ arrangements: object[], setlists: { items: { kind: string, title?: string, label?: string }[], archived?: boolean }[] }} data
 * @param {string} email the owning user's email (the users row must already exist)
 * @returns {string[]} one SQL statement per entry
 */
export function buildImportSql(data, email, { now = new Date().toISOString(), uuid = randomUUID } = {}) {
  const user = `(SELECT id FROM users WHERE email = ${q(email)})`
  const sql = []

  for (const raw of data.arrangements) {
    const a = arrangementInputSchema.parse(raw)
    const values = [uuid(), a.title, a.composer, a.musicalKey, a.tempo, a.beatsPerBar, a.feel, a.drumImplement, a.drumsEntry]
      .concat([a.drumsEntryNote, JSON.stringify(a.soloOrder), a.notes, now, now])
      .map(q)
    values.splice(1, 0, user)
    sql.push(`INSERT INTO arrangements (id, user_id, title, composer, musical_key, tempo, beats_per_bar, feel, drum_implement, drums_entry, drums_entry_note, solo_order, notes, created_at, updated_at)
SELECT ${values.join(', ')}
WHERE NOT EXISTS (SELECT 1 FROM arrangements WHERE user_id = ${user} AND title = ${q(a.title)} COLLATE NOCASE);`)
  }

  const titles = new Set(data.arrangements.map((a) => a.title.toLowerCase()))
  for (const raw of data.setlists) {
    const s = setlistInputSchema.parse(raw)
    // Items name tunes by title; the title stands in for arrangementId just to validate the shape.
    setlistItemsSchema.parse({ items: raw.items.map((i) => (i.kind === 'tune' ? { kind: 'tune', arrangementId: i.title } : i)) })
    const id = uuid()
    sql.push(`INSERT INTO setlists (id, user_id, name, venue, show_date, notes, archived_at, created_at, updated_at)
SELECT ${q(id)}, ${user}, ${q(s.name)}, ${q(s.venue)}, ${q(s.showDate)}, ${q(s.notes)}, ${q(raw.archived ? now : null)}, ${q(now)}, ${q(now)}
WHERE NOT EXISTS (SELECT 1 FROM setlists WHERE user_id = ${user} AND name = ${q(s.name)});`)
    raw.items.forEach((item, position) => {
      if (item.kind === 'tune' && !titles.has(item.title.toLowerCase())) throw new Error(`Setlist "${s.name}" has unknown tune "${item.title}"`)
      const arrangement =
        item.kind === 'tune'
          ? `(SELECT id FROM arrangements WHERE user_id = ${user} AND title = ${q(item.title)} COLLATE NOCASE ORDER BY created_at LIMIT 1)`
          : 'NULL'
      sql.push(`INSERT INTO setlist_items (id, setlist_id, position, kind, arrangement_id, label)
SELECT ${q(uuid())}, ${q(id)}, ${position}, ${q(item.kind)}, ${arrangement}, ${q(item.label ?? null)}
WHERE EXISTS (SELECT 1 FROM setlists WHERE id = ${q(id)});`)
    })
  }
  return sql
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [, , inFile, outFile, email] = process.argv
  if (!email) {
    console.error('usage: node scripts/polynome/to-sql.js import.json out.sql <user email>')
    process.exit(1)
  }
  const data = JSON.parse(readFileSync(inFile, 'utf8'))
  const sql = buildImportSql(data, email)
  writeFileSync(outFile, sql.join('\n') + '\n')
  console.log(`${data.arrangements.length} tunes, ${data.setlists.length} setlists, ${sql.length} statements -> ${outFile}`)
}
