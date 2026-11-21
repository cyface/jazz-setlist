<script>
  import Icon from './Icon.svelte'
  import { api } from '../lib/api.js'
  import { DOCUMENT_TYPES, LABELS } from '../../shared/attributes.js'
  import { MAX_DOCUMENT_BYTES, MAX_DOCUMENTS_PER_TUNE, documentUrl, formatSize } from '../../shared/documents.js'

  /** A tune's documents on the tune form. Each change is saved at once (a file upload can't wait for the form's Save). */
  let { arrangementId, documents = $bindable([]) } = $props()

  let type = $state(DOCUMENT_TYPES[0])
  let status = $state('')
  let error = $state('')
  let picker = $state()

  const full = $derived(documents.length >= MAX_DOCUMENTS_PER_TUNE)

  /** Runs one change; every API call here answers with the tune and its documents as they are now. */
  async function change(request) {
    try {
      documents = (await request()).documents
      return true
    } catch (err) {
      error = err.message
      return false
    }
  }

  async function upload(event) {
    const files = [...event.target.files]
    event.target.value = '' // so the same file can be picked again
    error = ''
    for (const file of files) {
      if (file.size > MAX_DOCUMENT_BYTES) {
        error = `${file.name} is ${formatSize(file.size)}; a document can be at most ${formatSize(MAX_DOCUMENT_BYTES)}.`
        break
      }
      status = `Uploading ${file.name}…`
      if (!(await change(() => api.uploadDocument(arrangementId, file, type)))) break
    }
    status = ''
  }

  function setType(doc, value) {
    error = ''
    return change(() => api.updateDocument(arrangementId, doc.id, { type: value }))
  }

  function remove(doc) {
    if (!confirm(`Remove “${doc.name}”? The file will be deleted.`)) return
    error = ''
    return change(() => api.deleteDocument(arrangementId, doc.id))
  }
</script>

{#if documents.length}
  <ul class="editor">
    {#each documents as doc (doc.id)}
      <li>
        <a class="name" href={documentUrl(doc)} target="_blank" rel="noopener">
          <Icon name="document" size={18} />
          <span>{doc.name}</span>
        </a>
        <span class="size">{formatSize(doc.size)}</span>
        <select value={doc.type} onchange={(e) => setType(doc, e.target.value)} aria-label="Type of {doc.name}">
          {#each DOCUMENT_TYPES as value (value)}<option {value}>{LABELS.documentType[value]}</option>{/each}
        </select>
        <button type="button" class="icon-button" onclick={() => remove(doc)} aria-label="Remove {doc.name}">
          <Icon name="close" size={18} />
        </button>
      </li>
    {/each}
  </ul>
{/if}

<div class="add">
  <label class="type">
    <span>Add as</span>
    <select bind:value={type}>
      {#each DOCUMENT_TYPES as value (value)}<option {value}>{LABELS.documentType[value]}</option>{/each}
    </select>
  </label>
  <button type="button" onclick={() => picker.click()} disabled={Boolean(status) || full}>
    <Icon name="plus" size={18} /> Choose files
  </button>
  <!-- The button above is the control; any kind of file can be picked (photos of lead sheets, PDFs, notation files…). -->
  <input bind:this={picker} type="file" multiple hidden onchange={upload} data-testid="document-files" />
</div>
<p class="hint" role="status">
  {#if status}
    {status}
  {:else if full}
    A tune can have at most {MAX_DOCUMENTS_PER_TUNE} documents.
  {:else}
    Photos, PDFs or any other file, up to {formatSize(MAX_DOCUMENT_BYTES)} each. Saved as soon as they're added.
  {/if}
</p>
{#if error}<p class="error">{error}</p>{/if}

<style>
  .editor {
    display: grid;
    gap: 0.5rem;
    margin: 0 0 0.75rem;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: var(--radius);
    background: var(--bg-raised);
    border: 1px solid var(--border);
  }
  .name {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    flex: 1 1 12rem;
    min-width: 0;
    font-weight: 600;
  }
  .name span {
    overflow-wrap: anywhere;
  }
  .size {
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }
  .add {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
  .type {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  .hint {
    margin: 0.5rem 0 0;
    color: var(--text-muted);
    font-size: 0.9rem;
  }
</style>
