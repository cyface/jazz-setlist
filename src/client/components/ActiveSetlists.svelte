<script>
  import Icon from './Icon.svelte'
  import { api } from '../lib/api.js'
  import { activeSetlists, setlistWhenWhere, tuneCountLabel, withSavedSetlist } from '../lib/setlists.js'

  /** The current shows, one tap from the Tunes page. Nothing at all when there are none. */
  let setlists = $state([])

  api
    .listSetlists()
    .then((rows) => (setlists = activeSetlists(rows)))
    // The tune list below is the page's main content and reports its own errors; a missing shortcut needs no second message.
    .catch(() => {})

  /** A tune was added from this page: keep the shortcut's count current. */
  export function update(saved) {
    setlists = withSavedSetlist(setlists, saved)
  }
</script>

{#if setlists.length}
  <nav class="active-setlists" aria-label="Active setlists">
    <ul class="rows">
      {#each setlists as s (s.id)}
        <li>
          <a class="row" href="#/setlists/{s.id}">
            <Icon name="setlists" size={20} />
            <span class="text">
              <span class="name">{s.name}</span>
              {#if setlistWhenWhere(s)}<span class="muted when">{setlistWhenWhere(s)}</span>{/if}
            </span>
            <span class="muted count">{tuneCountLabel(s.tuneCount)}</span>
            <Icon name="right" size={18} />
          </a>
        </li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  .active-setlists {
    margin-bottom: 1rem;
  }
  .row {
    border-color: var(--accent);
    color: var(--text);
  }
  .row :global(svg) {
    flex: none;
    color: var(--accent);
  }
  .row:hover {
    background: var(--hover);
  }
  .text {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 0.6rem;
    flex: 1;
    min-width: 0;
  }
  .name {
    font-weight: 700;
    font-size: 1.05rem;
    overflow-wrap: anywhere;
  }
  .when {
    font-size: 0.9rem;
  }
  .count {
    flex: none;
    font-size: 0.9rem;
  }
</style>
