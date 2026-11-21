/** Documents attached to a tune (lead sheet photos, arrangement PDFs…): limits and helpers shared by server and client. */

export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024
export const MAX_DOCUMENTS_PER_TUNE = 20
export const MAX_DOCUMENT_NAME = 200

/** Image types every browser shows in an <img>. */
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']

/** Types the server lets the browser display on the app's own origin; anything else (HTML, SVG…) only downloads. */
const INLINE_TYPES = [...IMAGE_TYPES, 'image/heic', 'image/heif', 'application/pdf']

export const isImage = (doc) => IMAGE_TYPES.includes(doc.contentType)
export const showsInline = (contentType) => INLINE_TYPES.includes(contentType)

/** Where the file itself is served from. */
export const documentUrl = (doc) => `/api/arrangements/${doc.arrangementId}/documents/${doc.id}/file`

/** 532 B, 48 KB, 3.4 MB, 20 MB */
export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`
}
