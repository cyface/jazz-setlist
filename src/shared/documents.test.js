import { describe, expect, it } from 'vitest'
import { documentUrl, formatSize, isImage, showsInline } from './documents.js'

describe('documents', () => {
  it('builds the file URL from the document', () => {
    expect(documentUrl({ id: 'd1', arrangementId: 'a1' })).toBe('/api/arrangements/a1/documents/d1/file')
  })

  it('formats sizes', () => {
    expect(formatSize(532)).toBe('532 B')
    expect(formatSize(48 * 1024)).toBe('48 KB')
    expect(formatSize(3.44 * 1024 * 1024)).toBe('3.4 MB')
    expect(formatSize(20 * 1024 * 1024)).toBe('20 MB')
  })

  it('shows photos as images, and lets only images and PDFs open in the browser', () => {
    expect(isImage({ contentType: 'image/jpeg' })).toBe(true)
    expect(isImage({ contentType: 'application/pdf' })).toBe(false)
    // HEIC opens in Safari but not in an <img> elsewhere; SVG and HTML can run scripts.
    expect(isImage({ contentType: 'image/heic' })).toBe(false)
    expect(isImage({ contentType: 'image/svg+xml' })).toBe(false)
    expect(showsInline('application/pdf')).toBe(true)
    expect(showsInline('image/heic')).toBe(true)
    expect(showsInline('image/svg+xml')).toBe(false)
    expect(showsInline('text/html')).toBe(false)
  })
})
