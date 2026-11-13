<script>
  import { searchTunes } from '../lib/search.js'

  /** `inSetlist`: arrangement ids already in the setlist, marked in the results. `onpick(arrangement)` adds one. */
  let { arrangements, inSetlist = new Set(), onpick } = $props()

  const uid = $props.id()
  let query = $state('')
  let active = $state(0)
  let input = $state()
  let list = $state()

  // The search sits at the bottom of the setlist: keep the matches on screen as they change.
  $effect(() => {
    if (list && results) list.scrollIntoView({ block: 'nearest' })
  })

  const results = $derived(searchTunes(arrangements, query))
  const open = $derived(query.trim() !== '')

  function pick(arrangement) {
    onpick(arrangement)
    query = ''
    active = 0
    input.focus() // ready for the next tune
  }

  function onkeydown(e) {
    if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault()
      active = (active + 1) % results.length
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault()
      active = (active - 1 + results.length) % results.length
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault()
      pick(results[active])
    } else if (e.key === 'Escape') {
      query = ''
    }
  }
</script>

<div class="tune-search">
  <input
    bind:this={input}
    bind:value={query}
    oninput={() => (active = 0)}
    {onkeydown}
    type="search"
    placeholder="Add a tune: search by title or composer"
    autocomplete="off"
    role="combobox"
    aria-label="Search tunes to add"
    aria-expanded={open}
    aria-controls="{uid}-results"
    aria-activedescendant={open && results.length ? `${uid}-${active}` : undefined}
  />
  {#if open}
    <ul bind:this={list} id="{uid}-results" class="results" role="listbox" aria-label="Matching tunes">
      {#each results as a, i (a.id)}
        <li
          id="{uid}-{i}"
          role="option"
          aria-selected={i === active}
          class:active={i === active}
          onmousedown={(e) => e.preventDefault()}
          onclick={() => pick(a)}
          onmouseenter={() => (active = i)}
        >
          <span class="title">{a.title}</span>
          {#if inSetlist.has(a.id)}<span class="muted in">in setlist</span>{/if}
          <span class="muted tempo">♩ = {a.tempo}</span>
        </li>
      {:else}
        <li class="muted none" role="presentation">No tunes match “{query.trim()}”.</li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .tune-search {
    flex: 1 1 16rem;
    min-width: 0;
  }
  input {
    margin: 0;
  }
  .results {
    display: grid;
    gap: 0.25rem;
    margin: 0.4rem 0 0;
    padding: 0.3rem;
    list-style: none;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg-raised);
  }
  li[role='option'] {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    padding: 0.55rem 0.6rem;
    border-radius: calc(var(--radius) - 0.2rem);
    cursor: pointer;
  }
  li.active {
    background: var(--hover);
    box-shadow: inset 3px 0 0 var(--accent);
  }
  .title {
    font-weight: 700;
  }
  .in {
    font-size: 0.85rem;
  }
  .tempo {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .none {
    padding: 0.55rem 0.6rem;
  }
</style>
