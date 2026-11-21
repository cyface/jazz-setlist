import { asc, eq, getTableColumns } from 'drizzle-orm'
import { arrangements, documents, setlistItems } from '../../db/schema.js'

/** Where a document's bytes live in the R2 bucket (binding DOCUMENTS). */
export const documentKey = (doc) => `${doc.arrangementId}/${doc.id}`

const columns = getTableColumns(documents)
const oldestFirst = [asc(documents.createdAt), asc(documents.id)]

export const documentsOfArrangement = (db, arrangementId) =>
  db.select().from(documents).where(eq(documents.arrangementId, arrangementId)).orderBy(...oldestFirst)

/** Every document on the user's tunes. (By join, not `IN (ids)`: D1 binds at most 100 values per statement.) */
export const documentsOfUser = (db, userId) =>
  db
    .select(columns)
    .from(documents)
    .innerJoin(arrangements, eq(documents.arrangementId, arrangements.id))
    .where(eq(arrangements.userId, userId))
    .orderBy(...oldestFirst)

/** Every document on the tunes in a setlist (once each, however often the tune is played). */
export const documentsOfSetlist = (db, setlistId) =>
  db
    .selectDistinct(columns)
    .from(documents)
    .innerJoin(setlistItems, eq(setlistItems.arrangementId, documents.arrangementId))
    .where(eq(setlistItems.setlistId, setlistId))
    .orderBy(...oldestFirst)

/** Returns a function that gives an arrangement row its `documents` (possibly none), as the API returns it. */
export function documentAttacher(docs) {
  const byArrangement = Map.groupBy(docs, (d) => d.arrangementId)
  return (arrangement) => ({ ...arrangement, documents: byArrangement.get(arrangement.id) ?? [] })
}

/** Deletes documents' files. Their rows go with the arrangement (cascade) or are deleted by the caller. */
export async function deleteFiles(bucket, docs) {
  if (docs.length) await bucket.delete(docs.map(documentKey))
}
