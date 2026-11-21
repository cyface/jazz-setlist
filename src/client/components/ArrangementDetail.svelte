<script>
  import Icon from './Icon.svelte'
  import { connection } from '../lib/connection.svelte.js'
  import { editTuneHref } from '../lib/router.js'
  import Metronome from './Metronome.svelte'
  import SoloOrder from './SoloOrder.svelte'
  import TuneBadges from './TuneBadges.svelte'
  import { LABELS } from '../../shared/attributes.js'
  import { documentUrl, formatSize, isImage } from '../../shared/documents.js'

  /** `editHref`: the Edit link, when the form should return somewhere other than this tune (a setlist). */
  let { arrangement, heading = undefined, editHref = undefined } = $props()

  // A tune saved for offline use before documents existed has none.
  const documents = $derived(arrangement.documents ?? [])
</script>

<article class="detail">
  <header>
    {#if heading}<p class="eyebrow">{heading}</p>{/if}
    <h2>{arrangement.title}</h2>
    <p class="meta">
      {[arrangement.composer, arrangement.musicalKey && `Key of ${arrangement.musicalKey}`]
        .filter(Boolean)
        .join(' · ')}
    </p>
    {#if !connection.offline}
      <a class="button edit" href={editHref ?? editTuneHref(arrangement.id)}><Icon name="edit" size={18} /> Edit</a>
    {/if}
  </header>

  {#key arrangement.id}
    <Metronome tempo={arrangement.tempo} beatsPerBar={arrangement.beatsPerBar} />
  {/key}

  <TuneBadges {arrangement} />
  {#if arrangement.drumsEntry === 'later' && arrangement.drumsEntryNote}
    <p class="entry-note"><strong>Drums come in:</strong> {arrangement.drumsEntryNote}</p>
  {/if}

  <section>
    <h3>Solo order</h3>
    <SoloOrder soloOrder={arrangement.soloOrder} />
  </section>

  {#if arrangement.notes}
    <section>
      <h3>Notes</h3>
      <p class="notes">{arrangement.notes}</p>
    </section>
  {/if}

  {#if documents.length}
    <section>
      <h3>Documents</h3>
      {#if connection.offline}
        <p class="offline-note">You're offline: a document shows only if this device has opened it before.</p>
      {/if}
      <ul class="documents">
        {#each documents as doc (doc.id)}
          <li>
            {#if isImage(doc)}
              <figure>
                <a href={documentUrl(doc)} target="_blank" rel="noopener" title="Open full size">
                  <img src={documentUrl(doc)} alt="{LABELS.documentType[doc.type]}: {doc.name}" loading="lazy" />
                </a>
                <figcaption>{LABELS.documentType[doc.type]} · {doc.name}</figcaption>
              </figure>
            {:else}
              <a class="file" href={documentUrl(doc)} target="_blank" rel="noopener">
                <Icon name="document" />
                <span>
                  <strong>{doc.name}</strong>
                  <span class="file-meta">{LABELS.documentType[doc.type]} · {formatSize(doc.size)}</span>
                </span>
              </a>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</article>

<style>
  .detail {
    display: grid;
    gap: 1.25rem;
  }
  header {
    position: relative;
    padding-right: 6rem;
  }
  h2 {
    margin: 0;
    font-size: 1.9rem;
  }
  .meta {
    margin: 0.25rem 0 0;
    color: var(--text-muted);
  }
  .eyebrow {
    margin: 0 0 0.2rem;
    color: var(--accent);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.8rem;
  }
  .edit {
    position: absolute;
    top: 0;
    right: 0;
  }
  h3 {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
  }
  .entry-note {
    margin: 0;
  }
  .notes {
    margin: 0;
    white-space: pre-wrap;
  }
  .documents {
    display: grid;
    gap: 1rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .offline-note {
    margin: 0 0 0.75rem;
    color: var(--text-muted);
  }
  figure {
    margin: 0;
  }
  /* A lead sheet photo fills the column, so it can be read from the drum stool. */
  img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: var(--radius);
    border: 1px solid var(--border);
  }
  figcaption,
  .file-meta {
    color: var(--text-muted);
    font-size: 0.9rem;
  }
  figcaption {
    margin-top: 0.35rem;
  }
  .file {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.75rem;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--bg-raised);
    text-decoration: none;
  }
  .file > span {
    display: grid;
    min-width: 0;
  }
  .file strong {
    overflow-wrap: anywhere;
  }
</style>
