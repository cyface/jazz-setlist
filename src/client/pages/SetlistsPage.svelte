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

  {#if !archived}
    <form class="new-setlist" onsubmit={create}>
      <input bind:value={draft.name} placeholder="Show name" required maxlength="200" aria-label="Show name" />
      <input type="date" bind:value={draft.showDate} aria-label="Show date" />
      <input bind:value={draft.venue} placeholder="Venue" maxlength="200" aria-label="Venue" />
      <button class="primary" type="submit"><Icon name="plus" size={18} /> New setlist</button>
    </form>
  {/if}

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
</section>

<style>
  .new-setlist {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  .new-setlist input:first-child {
    flex: 1 1 14rem;
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
