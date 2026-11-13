<script>
  import AddToSetlist from '../components/AddToSetlist.svelte'
  import ArrangementDetail from '../components/ArrangementDetail.svelte'
  import Icon from '../components/Icon.svelte'
  import TuneBadges from '../components/TuneBadges.svelte'
  import { api } from '../lib/api.js'
  import { longpress } from '../lib/longpress.js'

  let { selectedId } = $props()

  let arrangements = $state([])
  let loading = $state(true)
  let error = $state('')
  let query = $state('')
  let addToSetlist = $state()

  const filtered = $derived(
    arrangements.filter((a) =>
      `${a.title} ${a.composer ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()),
    ),
  )
  const selected = $derived(arrangements.find((a) => a.id === selectedId))

  api
    .listArrangements()
    .then((rows) => (arrangements = rows))
    .catch((e) => (error = e.message))
    .finally(() => (loading = false))
</script>

<div class="split" class:has-selection={selected}>
  <section class="list-pane">
    <div class="toolbar">
      <h1>Tunes</h1>
      <a class="button primary" href="#/arrangements/new"><Icon name="plus" size={18} /> New tune</a>
    </div>
    <input type="search" placeholder="Search tunes" bind:value={query} aria-label="Search tunes" />

    {#if error}<p class="error">{error}</p>{/if}
    {#if loading}
      <p class="muted">Loading…</p>
    {:else if !arrangements.length}
      <p class="muted">No tunes yet. Add your first arrangement.</p>
    {:else}
      <ul class="rows">
        {#each filtered as a (a.id)}
          <li>
            <a
              href="#/arrangements/{a.id}"
              class="row"
              class:active={a.id === selectedId}
              use:longpress={() => addToSetlist.open(a)}
              title="Right-click to add to a setlist"
            >
              <span class="title">{a.title}</span>
              <span class="tempo">♩ = {a.tempo}</span>
              <TuneBadges arrangement={a} compact />
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  {#if selected}
    <section class="detail-pane">
      <a class="back" href="#/"><Icon name="left" size={18} /> All tunes</a>
      <ArrangementDetail arrangement={selected} />
    </section>
  {/if}
</div>

<AddToSetlist bind:this={addToSetlist} />

<style>
  .title {
    font-weight: 700;
    font-size: 1.05rem;
  }
  .tempo {
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    margin-left: auto;
  }
  .row {
    flex-wrap: wrap;
    /* Holding a row on a touch screen adds the tune to a setlist: no text selection or iOS link preview. */
    -webkit-touch-callout: none;
    user-select: none;
    min-height: 3.25rem; /* rows keep one height when "hide defaults" leaves no badges */
  }
</style>
