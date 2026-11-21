import { Hono } from 'hono'
import { and, eq, sql } from 'drizzle-orm'
import { arrangements } from '../../db/schema.js'
import { arrangementInputSchema } from '../../shared/validation.js'
import { deleteFiles, documentAttacher, documentsOfArrangement, documentsOfUser } from '../lib/documents.js'
import { notFound, now, omitUserId, parseBody } from '../lib/http.js'

const owned = (c, id) =>
  and(eq(arrangements.id, id), eq(arrangements.userId, c.get('user').id))

/** A tune as the API returns it: without the user id, with its documents. */
const withDocuments = async (c, row) =>
  documentAttacher(await documentsOfArrangement(c.get('db'), row.id))(omitUserId(row))

export const arrangementsRoutes = new Hono()
  .get('/', async (c) => {
    const db = c.get('db')
    const rows = await db
      .select()
      .from(arrangements)
      .where(eq(arrangements.userId, c.get('user').id))
      .orderBy(sql`${arrangements.title} collate nocase`)
    const attach = documentAttacher(await documentsOfUser(db, c.get('user').id))
    return c.json({ arrangements: rows.map(omitUserId).map(attach) })
  })
  .post('/', async (c) => {
    const input = await parseBody(c, arrangementInputSchema)
    const ts = now()
    const [row] = await c
      .get('db')
      .insert(arrangements)
      .values({ ...input, id: crypto.randomUUID(), userId: c.get('user').id, createdAt: ts, updatedAt: ts })
      .returning()
    return c.json({ arrangement: { ...omitUserId(row), documents: [] } }, 201)
  })
  .get('/:id', async (c) => {
    const row = await c.get('db').select().from(arrangements).where(owned(c, c.req.param('id'))).get()
    if (!row) throw notFound('Arrangement')
    return c.json({ arrangement: await withDocuments(c, row) })
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
    return c.json({ arrangement: await withDocuments(c, row) })
  })
  .delete('/:id', async (c) => {
    const db = c.get('db')
    const row = await db.select({ id: arrangements.id }).from(arrangements).where(owned(c, c.req.param('id'))).get()
    if (!row) throw notFound('Arrangement')
    // The document rows go with the tune (cascade); their files have to be deleted here.
    const docs = await documentsOfArrangement(db, row.id)
    await db.delete(arrangements).where(owned(c, row.id))
    await deleteFiles(c.env.DOCUMENTS, docs)
    return c.body(null, 204)
  })
