<script>
  import Icon from '../components/Icon.svelte'
  import { api } from '../lib/api.js'
  import { navigate } from '../lib/router.js'

  /** true on #/setlists/archived. */
  let { archived = false } = $props()

  let setlists = $state([])
  let loading = $state(true)
  let error = $state('')
  let draft = $state({ name: '', showDate: '', venue: '' })
  /** The last archive/restore, so it can be undone: { id, name, archived }. */
  let lastChange = $state(null)

  const active = $derived(setlists.filter((s) => !s.archivedAt))
  const archivedList = $derived(setlists.filter((s) => s.archivedAt))
  const shown = $derived(archived ? archivedList : active)

  api
    .listSetlists()
    .then((rows) => (setlists = rows))
    .catch((e) => (error = e.message))
    .finally(() => (loading = false))

  async function create(e) {
    e.preventDefault()
    try {
      const setlist = await api.createSetlist($state.snapshot(draft))
      navigate(`/setlists/${setlist.id}`)
    } catch (err) {
      error = err.message
    }
  }

  async function setArchived(s, value) {
    error = ''
    try {
      const updated = await api.setSetlistArchived(s.id, value)
      s.archivedAt = updated.archivedAt
      lastChange = { id: s.id, name: s.name, archived: value }
    } catch (err) {
      error = err.message
    }
  }

  async function undo() {
    const s = setlists.find((x) => x.id === lastChange?.id)
    if (!s) return
    await setArchived(s, !lastChange.archived)
    lastChange = null
  }

  const formatDate = (d) =>
    d ? new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''
</script>

<section class="narrow">
  <h1>Setlists</h1>

  <nav class="tabs" aria-label="Setlist status">
    <a href="#/setlists" aria-current={archived ? undefined : 'page'}>
      Active {#if !loading}<span class="tab-count">{active.length}</span>{/if}
    </a>
    <a href="#/setlists/archived" aria-current={archived ? 'page' : undefined}>
      <Icon name="archive" size={18} /> Archived {#if !loading}<span class="tab-count">{archivedList.length}</span>{/if}
    </a>
  </nav>

  {#if lastChange}
    <p class="notice" role="status">
      {lastChange.archived ? 'Archived' : 'Restored'} “{lastChange.name}”.
      <button class="link" onclick={undo}>Undo</button>
    </p>
  {/if}
  {#if error}<p class="error">{error}</p>{/if}

  {#if loading}
    <p class="muted">Loading…</p>
  {:else if !shown.length}
    <p class="muted">
      {#if archived}
        No archived setlists. Archive a past show to keep it without cluttering this list.
      {:else if archivedList.length}
        No active setlists. Past shows are under <a href="#/setlists/archived">Archived</a>.
      {:else}
        No setlists yet.
      {/if}
    </p>
  {:else}
    <ul class="rows">
      {#each shown as s (s.id)}
        <li class="row setlist-row">
          <a class="open" href="#/setlists/{s.id}">
            <span class="title">{s.name}</span>
            <span class="muted">{[formatDate(s.showDate), s.venue].filter(Boolean).join(' · ')}</span>
            <span class="count">{s.tuneCount} {s.tuneCount === 1 ? 'tune' : 'tunes'}</span>
          </a>
          {#if s.archivedAt}
            <button class="icon-button" onclick={() => setArchived(s, false)} aria-label="Restore {s.name}" title="Move back to active">
              <Icon name="unarchive" size={18} />
            </button>
          {:else}
            <button class="icon-button" onclick={() => setArchived(s, true)} aria-label="Archive {s.name}" title="Archive">
              <Icon name="archive" size={18} />
            </button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  {#if !archived}
    <!-- Below the list: your current setlists are what you usually come here for. -->
    <form class="new-setlist" onsubmit={create} aria-labelledby="new-setlist-heading">
      <h2 id="new-setlist-heading">New setlist</h2>
      <label class="field name">
        <span>Show name</span>
        <input bind:value={draft.name} required maxlength="200" />
      </label>
      <label class="field">
        <span>Date</span>
        <input type="date" bind:value={draft.showDate} />
      </label>
      <label class="field">
        <span>Venue</span>
        <input bind:value={draft.venue} maxlength="200" />
      </label>
      <button class="primary" type="submit"><Icon name="plus" size={18} /> Create setlist</button>
    </form>
  {/if}
</section>

<style>
  /* Phones: name full width, date and venue side by side, then a full-width button. */
  .new-setlist {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    margin-top: 2rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--border);
  }
  .new-setlist h2 {
    grid-column: 1 / -1;
    margin: 0;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
  }
  .new-setlist .name,
  .new-setlist button {
    grid-column: 1 / -1;
  }
  .new-setlist input {
    width: 100%;
    min-width: 0;
    min-height: 2.75rem;
  }
  .new-setlist button {
    min-height: 2.75rem;
  }
  /* Wider: the button sits beside date and venue. */
  @media (min-width: 600px) {
    .new-setlist {
      grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
      align-items: end;
    }
    .new-setlist button {
      grid-column: auto;
    }
  }
  .setlist-row {
    padding: 0 0.4rem 0 0;
  }
  .open {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
    flex: 1;
    min-width: 0;
    padding: 0.6rem 0.75rem;
    color: inherit;
    text-decoration: none;
  }
  .title {
    font-weight: 700;
  }
  .count {
    margin-left: auto;
    color: var(--text-muted);
  }
  .notice {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem;
    color: var(--text-muted);
  }
</style>
