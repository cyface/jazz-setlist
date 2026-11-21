import { beforeEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-svelte'
import DocumentsEditor from './DocumentsEditor.svelte'
import { api } from '../lib/api.js'
import { MAX_DOCUMENT_BYTES } from '../../shared/documents.js'
import { SO_WHAT, document } from '../test/fixtures.js'

vi.mock('../lib/api.js', () => ({ api: { uploadDocument: vi.fn(), updateDocument: vi.fn(), deleteDocument: vi.fn() } }))

const SHEET = document(SO_WHAT.id, 'so what.png')
const CHART = document(SO_WHAT.id, 'chart.pdf', { type: 'arrangement', contentType: 'application/pdf' })
const photo = (name = 'page 2.jpg') => new File([new Uint8Array(2048)], name, { type: 'image/jpeg' })

/** The server's copy of the tune's documents; each mocked call changes it and answers with the tune. */
let server
const answer = () => ({ ...SO_WHAT, documents: server })

beforeEach(() => {
  server = [SHEET, CHART]
  vi.mocked(api.uploadDocument)
    .mockReset()
    .mockImplementation(async (arrangementId, file, type) => {
      server = [...server, document(arrangementId, file.name, { type, contentType: file.type, size: file.size })]
      return answer()
    })
  vi.mocked(api.updateDocument)
    .mockReset()
    .mockImplementation(async (_arrangementId, id, data) => {
      server = server.map((d) => (d.id === id ? { ...d, ...data } : d))
      return answer()
    })
  vi.mocked(api.deleteDocument)
    .mockReset()
    .mockImplementation(async (_arrangementId, id) => {
      server = server.filter((d) => d.id !== id)
      return answer()
    })
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

const open = (documents = [SHEET, CHART]) => render(DocumentsEditor, { arrangementId: SO_WHAT.id, documents })
const pick = (screen, ...files) => userEvent.upload(screen.getByTestId('document-files'), files)

describe('DocumentsEditor', () => {
  it('lists the tune’s documents, each linked to its file', async () => {
    const screen = await open()
    await expect
      .element(screen.getByRole('link', { name: 'so what.png' }))
      .toHaveAttribute('href', `/api/arrangements/${SO_WHAT.id}/documents/${SHEET.id}/file`)
    await expect.element(screen.getByRole('combobox', { name: 'Type of so what.png' })).toHaveValue('lead_sheet')
    await expect.element(screen.getByRole('combobox', { name: 'Type of chart.pdf' })).toHaveValue('arrangement')
  })

  it('uploads the chosen files with the chosen type, at once', async () => {
    const screen = await open()
    await screen.getByRole('combobox', { name: 'Add as' }).selectOptions('Extended notes')
    await pick(screen, photo('page 2.jpg'), photo('page 3.jpg'))

    await expect.element(screen.getByRole('link', { name: 'page 3.jpg' })).toBeVisible()
    expect(vi.mocked(api.uploadDocument).mock.calls.map(([id, file, type]) => [id, file.name, type])).toEqual([
      [SO_WHAT.id, 'page 2.jpg', 'extended_notes'],
      [SO_WHAT.id, 'page 3.jpg', 'extended_notes'],
    ])
    await expect.element(screen.getByRole('combobox', { name: 'Type of page 2.jpg' })).toHaveValue('extended_notes')
  })

  it('changes a document’s type', async () => {
    const screen = await open()
    await screen.getByRole('combobox', { name: 'Type of so what.png' }).selectOptions('Arrangement')
    expect(api.updateDocument).toHaveBeenCalledWith(SO_WHAT.id, SHEET.id, { type: 'arrangement' })
    await expect.element(screen.getByRole('combobox', { name: 'Type of so what.png' })).toHaveValue('arrangement')
  })

  it('removes a document after asking, and keeps it when the answer is no', async () => {
    const screen = await open()
    vi.mocked(window.confirm).mockReturnValueOnce(false)
    await screen.getByRole('button', { name: 'Remove so what.png' }).click()
    expect(api.deleteDocument).not.toHaveBeenCalled()

    await screen.getByRole('button', { name: 'Remove so what.png' }).click()
    expect(api.deleteDocument).toHaveBeenCalledWith(SO_WHAT.id, SHEET.id)
    await expect.element(screen.getByRole('link', { name: 'so what.png' })).not.toBeInTheDocument()
    await expect.element(screen.getByRole('link', { name: 'chart.pdf' })).toBeVisible()
  })

  it('turns away a file over the size limit without uploading it', async () => {
    const screen = await open([])
    await pick(screen, new File([new Uint8Array(MAX_DOCUMENT_BYTES + 1)], 'huge.tiff', { type: 'image/tiff' }))
    await expect.element(screen.getByText('huge.tiff is 20 MB; a document can be at most 20 MB.')).toBeVisible()
    expect(api.uploadDocument).not.toHaveBeenCalled()
  })

  it('shows why an upload failed and keeps the documents it has', async () => {
    vi.mocked(api.uploadDocument).mockRejectedValue(new Error('A tune can have at most 20 documents'))
    const screen = await open()
    await pick(screen, photo())
    await expect.element(screen.getByText('A tune can have at most 20 documents')).toBeVisible()
    await expect.element(screen.getByRole('link', { name: 'so what.png' })).toBeVisible()
    await expect.element(screen.getByRole('button', { name: 'Choose files' })).toBeEnabled()
  })
})
