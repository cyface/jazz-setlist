import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { arrangements, setlistItems, setlists } from '../../db/schema.js'
import { setlistAddTuneSchema, setlistArchiveSchema, setlistInputSchema, setlistItemsSchema } from '../../shared/validation.js'
import { notFound, now, omitUserId, parseBody } from '../lib/http.js'

const owned = (c, id) => and(eq(setlists.id, id), eq(setlists.userId, c.get('user').id))

async function loadSetlist(c, id) {
  const db = c.get('db')
  const setlist = await db.select().from(setlists).where(owned(c, id)).get()
  if (!setlist) throw notFound('Setlist')
  const rows = await db
    .select({ item: setlistItems, arrangement: arrangements })
    .from(setlistItems)
    .leftJoin(arrangements, eq(setlistItems.arrangementId, arrangements.id))
    .where(eq(setlistItems.setlistId, id))
    .orderBy(asc(setlistItems.position))
  const items = rows.map(({ item, arrangement }) => ({
    id: item.id,
    kind: item.kind,
    label: item.label,
    arrangement: arrangement ? omitUserId(arrangement) : null,
  }))
  return { ...omitUserId(setlist), items }
}

export const setlistsRoutes = new Hono()
  .get('/', async (c) => {
    // ?contains=<arrangementId> adds hasTune: whether each setlist already has that tune.
    const contains = c.req.query('contains')
    const rows = await c
      .get('db')
      .select({
        id: setlists.id,
        name: setlists.name,
        venue: setlists.venue,
        showDate: setlists.showDate,
        archivedAt: setlists.archivedAt,
        updatedAt: setlists.updatedAt,
        tuneCount: sql`(select count(*) from setlist_items si where si.setlist_id = "setlists"."id" and si.kind = 'tune')`.mapWith(Number),
        ...(contains && {
          hasTune: sql`exists(select 1 from setlist_items si where si.setlist_id = "setlists"."id" and si.arrangement_id = ${contains})`.mapWith(Boolean),
        }),
      })
      .from(setlists)
      .where(eq(setlists.userId, c.get('user').id))
      .orderBy(desc(setlists.showDate), desc(setlists.updatedAt))
    return c.json({ setlists: rows })
  })
  .post('/', async (c) => {
    const input = await parseBody(c, setlistInputSchema)
    const ts = now()
    const id = crypto.randomUUID()
    await c
      .get('db')
      .insert(setlists)
      .values({ ...input, id, userId: c.get('user').id, createdAt: ts, updatedAt: ts })
    return c.json({ setlist: await loadSetlist(c, id) }, 201)
  })
  .get('/:id', async (c) => c.json({ setlist: await loadSetlist(c, c.req.param('id')) }))
  .put('/:id', async (c) => {
    const input = await parseBody(c, setlistInputSchema)
    const id = c.req.param('id')
    const [row] = await c
      .get('db')
      .update(setlists)
      .set({ ...input, updatedAt: now() })
      .where(owned(c, id))
      .returning({ id: setlists.id })
    if (!row) throw notFound('Setlist')
    return c.json({ setlist: await loadSetlist(c, id) })
  })
  .put('/:id/archived', async (c) => {
    const { archived } = await parseBody(c, setlistArchiveSchema)
    const id = c.req.param('id')
    const [row] = await c
      .get('db')
      .update(setlists)
      .set({ archivedAt: archived ? now() : null })
      .where(owned(c, id))
      .returning({ id: setlists.id })
    if (!row) throw notFound('Setlist')
    return c.json({ setlist: await loadSetlist(c, id) })
  })
  .put('/:id/items', async (c) => {
    const { items } = await parseBody(c, setlistItemsSchema)
    const db = c.get('db')
    const id = c.req.param('id')
    const setlist = await db.select({ id: setlists.id }).from(setlists).where(owned(c, id)).get()
    if (!setlist) throw notFound('Setlist')

    const arrangementIds = [...new Set(items.filter((i) => i.kind === 'tune').map((i) => i.arrangementId))]
    if (arrangementIds.length) {
      const found = await db
        .select({ id: arrangements.id })
        .from(arrangements)
        .where(and(eq(arrangements.userId, c.get('user').id), inArray(arrangements.id, arrangementIds)))
      if (found.length !== arrangementIds.length) {
        throw new HTTPException(400, { message: 'Unknown arrangement in setlist' })
      }
    }

    const rows = items.map((item, position) => ({
      id: crypto.randomUUID(),
      setlistId: id,
      position,
      kind: item.kind,
      arrangementId: item.kind === 'tune' ? item.arrangementId : null,
      label: item.kind === 'break' ? item.label : null,
    }))
    await db.batch([
      db.delete(setlistItems).where(eq(setlistItems.setlistId, id)),
      ...(rows.length ? [db.insert(setlistItems).values(rows)] : []),
      db.update(setlists).set({ updatedAt: now() }).where(eq(setlists.id, id)),
    ])
    return c.json({ setlist: await loadSetlist(c, id) })
  })
  .post('/:id/items', async (c) => {
    const { arrangementId } = await parseBody(c, setlistAddTuneSchema)
    const db = c.get('db')
    const id = c.req.param('id')
    const setlist = await db.select({ id: setlists.id }).from(setlists).where(owned(c, id)).get()
    if (!setlist) throw notFound('Setlist')
    const arrangement = await db
      .select({ id: arrangements.id })
      .from(arrangements)
      .where(and(eq(arrangements.id, arrangementId), eq(arrangements.userId, c.get('user').id)))
      .get()
    if (!arrangement) throw new HTTPException(400, { message: 'Unknown arrangement' })

    await db.batch([
      db.insert(setlistItems).values({
        id: crypto.randomUUID(),
        setlistId: id,
        // After the last item, computed in the INSERT so concurrent adds can't pick the same position.
        position: sql`(select coalesce(max(${setlistItems.position}), -1) + 1 from ${setlistItems} where ${setlistItems.setlistId} = ${id})`,
        kind: 'tune',
        arrangementId,
      }),
      db.update(setlists).set({ updatedAt: now() }).where(eq(setlists.id, id)),
    ])
    return c.json({ setlist: await loadSetlist(c, id) }, 201)
  })
  .delete('/:id', async (c) => {
    const [row] = await c
      .get('db')
      .delete(setlists)
      .where(owned(c, c.req.param('id')))
      .returning({ id: setlists.id })
    if (!row) throw notFound('Setlist')
    return c.body(null, 204)
  })
