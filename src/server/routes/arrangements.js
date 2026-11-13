import { Hono } from 'hono'
import { and, eq, sql } from 'drizzle-orm'
import { arrangements } from '../../db/schema.js'
import { arrangementInputSchema } from '../../shared/validation.js'
import { notFound, now, omitUserId, parseBody } from '../lib/http.js'

const owned = (c, id) =>
  and(eq(arrangements.id, id), eq(arrangements.userId, c.get('user').id))

export const arrangementsRoutes = new Hono()
  .get('/', async (c) => {
    const rows = await c
      .get('db')
      .select()
      .from(arrangements)
      .where(eq(arrangements.userId, c.get('user').id))
      .orderBy(sql`${arrangements.title} collate nocase`)
    return c.json({ arrangements: rows.map(omitUserId) })
  })
  .post('/', async (c) => {
    const input = await parseBody(c, arrangementInputSchema)
    const ts = now()
    const [row] = await c
      .get('db')
      .insert(arrangements)
      .values({ ...input, id: crypto.randomUUID(), userId: c.get('user').id, createdAt: ts, updatedAt: ts })
      .returning()
    return c.json({ arrangement: omitUserId(row) }, 201)
  })
  .get('/:id', async (c) => {
    const row = await c.get('db').select().from(arrangements).where(owned(c, c.req.param('id'))).get()
    if (!row) throw notFound('Arrangement')
    return c.json({ arrangement: omitUserId(row) })
  })
  .put('/:id', async (c) => {
    const input = await parseBody(c, arrangementInputSchema)
    const [row] = await c
      .get('db')
      .update(arrangements)
      .set({ ...input, updatedAt: now() })
      .where(owned(c, c.req.param('id')))
      .returning()
    if (!row) throw notFound('Arrangement')
    return c.json({ arrangement: omitUserId(row) })
  })
  .delete('/:id', async (c) => {
    const [row] = await c
      .get('db')
      .delete(arrangements)
      .where(owned(c, c.req.param('id')))
      .returning({ id: arrangements.id })
    if (!row) throw notFound('Arrangement')
    return c.body(null, 204)
  })
