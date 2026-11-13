<script>
  import Icon from '../components/Icon.svelte'
  import { api } from '../lib/api.js'
  import { navigate } from '../lib/router.js'

  let setlists = $state([])
  let loading = $state(true)
  let error = $state('')
  let draft = $state({ name: '', showDate: '', venue: '' })

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

  const formatDate = (d) =>
    d ? new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''
</script>

<section class="narrow">
  <h1>Setlists</h1>

  <form class="new-setlist" onsubmit={create}>
    <input bind:value={draft.name} placeholder="Show name" required maxlength="200" aria-label="Show name" />
    <input type="date" bind:value={draft.showDate} aria-label="Show date" />
    <input bind:value={draft.venue} placeholder="Venue" maxlength="200" aria-label="Venue" />
    <button class="primary" type="submit"><Icon name="plus" size={18} /> New setlist</button>
  </form>

  {#if error}<p class="error">{error}</p>{/if}
  {#if loading}
    <p class="muted">Loading…</p>
  {:else if !setlists.length}
    <p class="muted">No setlists yet.</p>
  {:else}
    <ul class="rows">
      {#each setlists as s (s.id)}
        <li>
          <a class="row" href="#/setlists/{s.id}">
            <span class="title">{s.name}</span>
            <span class="muted">{[formatDate(s.showDate), s.venue].filter(Boolean).join(' · ')}</span>
            <span class="count">{s.tuneCount} {s.tuneCount === 1 ? 'tune' : 'tunes'}</span>
          </a>
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
  .title {
    font-weight: 700;
  }
  .row {
    flex-wrap: wrap;
  }
  .count {
    margin-left: auto;
    color: var(--text-muted);
  }
</style>
