import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { and, count, eq } from 'drizzle-orm'
import { arrangements, documents } from '../../db/schema.js'
import { MAX_DOCUMENT_BYTES, MAX_DOCUMENT_NAME, MAX_DOCUMENTS_PER_TUNE, formatSize, showsInline } from '../../shared/documents.js'
import { documentTypeSchema, documentUpdateSchema } from '../../shared/validation.js'
import { deleteFiles, documentAttacher, documentKey, documentsOfArrangement } from '../lib/documents.js'
import { notFound, now, omitUserId, parseBody } from '../lib/http.js'

/** RFC 5987 `filename*` value: encodeURIComponent leaves ' ( ) * as they are, which the header doesn't allow. */
const headerFilename = (name) => encodeURIComponent(name).replace(/['()*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`)

const badRequest = (message) => new HTTPException(400, { message })
const tooLarge = () => new HTTPException(413, { message: `A document can be at most ${formatSize(MAX_DOCUMENT_BYTES)}` })

/** The tune in the URL, if it is the user's: every route here starts with this check. */
async function ownedArrangement(c) {
  const row = await c
    .get('db')
    .select()
    .from(arrangements)
    .where(and(eq(arrangements.id, c.req.param('arrangementId')), eq(arrangements.userId, c.get('user').id)))
    .get()
  if (!row) throw notFound('Arrangement')
  return row
}

async function ownedDocument(c) {
  const arrangement = await ownedArrangement(c)
  const doc = await c
    .get('db')
    .select()
    .from(documents)
    .where(and(eq(documents.id, c.req.param('documentId')), eq(documents.arrangementId, arrangement.id)))
    .get()
  if (!doc) throw notFound('Document')
  return { arrangement, doc }
}

/** The tune with its documents, which every change here answers with (the client replaces its copy). */
async function arrangementJson(c, arrangement) {
  const docs = await documentsOfArrangement(c.get('db'), arrangement.id)
  return { arrangement: documentAttacher(docs)(omitUserId(arrangement)) }
}

/** Mounted at /api/arrangements/:arrangementId/documents. */
export const documentsRoutes = new Hono()
  // multipart/form-data: `file` (any type of file) and `type` (DOCUMENT_TYPES).
  .post('/', async (c) => {
    const arrangement = await ownedArrangement(c)
    // Turn away an oversized upload before reading it (the form's other fields and boundaries add a little).
    if (Number(c.req.header('content-length')) > MAX_DOCUMENT_BYTES + 16 * 1024) throw tooLarge()

    let form
    try {
      form = await c.req.formData()
    } catch {
      throw badRequest('Body must be multipart form data')
    }
    const type = documentTypeSchema.safeParse(form.get('type'))
    if (!type.success) throw badRequest('type: Invalid document type')
    const file = form.get('file')
    if (!(file instanceof File)) throw badRequest('file: A file is required')
    if (file.size === 0) throw badRequest('file: The file is empty')
    if (file.size > MAX_DOCUMENT_BYTES) throw tooLarge()

    const db = c.get('db')
    const [{ n }] = await db.select({ n: count() }).from(documents).where(eq(documents.arrangementId, arrangement.id))
    if (n >= MAX_DOCUMENTS_PER_TUNE) throw badRequest(`A tune can have at most ${MAX_DOCUMENTS_PER_TUNE} documents`)

    const doc = {
      id: crypto.randomUUID(),
      arrangementId: arrangement.id,
      type: type.data,
      name: file.name.trim().slice(0, MAX_DOCUMENT_NAME) || 'Untitled',
      contentType: file.type || 'application/octet-stream',
      size: file.size,
      createdAt: now(),
    }
    // File first: a row always has its file. If the row can't be written, the file goes again.
    await c.env.DOCUMENTS.put(documentKey(doc), await file.arrayBuffer(), { httpMetadata: { contentType: doc.contentType } })
    try {
      await db.insert(documents).values(doc)
    } catch (err) {
      await deleteFiles(c.env.DOCUMENTS, [doc])
      throw err
    }
    return c.json(await arrangementJson(c, arrangement), 201)
  })
  .get('/:documentId/file', async (c) => {
    const { doc } = await ownedDocument(c)
    const object = await c.env.DOCUMENTS.get(documentKey(doc))
    if (!object) throw notFound('Document')
    // Uploads can be anything, so only images and PDFs open in the browser; the rest (HTML, SVG…) download, and
    // nothing is sniffed into another type. A document's bytes never change, so the browser may keep them.
    const disposition = showsInline(doc.contentType) ? 'inline' : 'attachment'
    return c.body(object.body, 200, {
      'content-type': doc.contentType,
      'content-length': String(object.size),
      'content-disposition': `${disposition}; filename*=UTF-8''${headerFilename(doc.name)}`,
      'x-content-type-options': 'nosniff',
      'cache-control': 'private, max-age=31536000, immutable',
      etag: object.httpEtag,
    })
  })
  .put('/:documentId', async (c) => {
    const { type } = await parseBody(c, documentUpdateSchema)
    const { arrangement, doc } = await ownedDocument(c)
    await c.get('db').update(documents).set({ type }).where(eq(documents.id, doc.id))
    return c.json(await arrangementJson(c, arrangement))
  })
  .delete('/:documentId', async (c) => {
    const { arrangement, doc } = await ownedDocument(c)
    await c.get('db').delete(documents).where(eq(documents.id, doc.id))
    await deleteFiles(c.env.DOCUMENTS, [doc])
    return c.json(await arrangementJson(c, arrangement))
  })
