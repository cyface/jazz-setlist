<script>
  import Icon from './Icon.svelte'
  import { api } from '../lib/api.js'
  import { addMenu, addedMessage } from '../lib/add-to-setlist.js'

  let dialog = $state()
  let tune = $state(null)
  let choices = $state([])
  let already = $state(null)
  let busy = $state(false)
  let toast = $state(null) // { text, href?, link?, error? }
  let toastTimer
  let request = 0 // drops a slow listing that a newer open() has replaced
  let armed = false // pointer clicks count only after a press that started inside the open menu

  const formatDate = (d) =>
    d ? new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : ''

  function show(next) {
    toast = next
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toast = null), next.error ? 8000 : 5000)
  }

  /** Opens the actions for `arrangement`: "Add to <setlist>" for each active setlist. */
  export async function open(arrangement) {
    if (busy || dialog.open) return
    const mine = ++request
    try {
      const menu = addMenu(await api.listSetlists(arrangement.id))
      if (mine !== request || dialog.open) return
      tune = arrangement
      ;({ already, choices } = menu)
      armed = false
      dialog.showModal()
    } catch (e) {
      show({ text: e.message, error: true })
    }
  }

  async function add(setlist) {
    busy = true
    try {
      const saved = await api.addTuneToSetlist(setlist.id, tune.id)
      if (dialog.open) dialog.close()
      show({ text: addedMessage(tune, saved), href: `#/setlists/${saved.id}`, link: 'Open' })
    } catch (e) {
      if (dialog.open) dialog.close()
      show({ text: e.message, error: true })
    } finally {
      busy = false
    }
  }
</script>

<!-- On touch screens the finger that held a row lifts after the menu opens; that click must not pick or dismiss. -->
<dialog
  bind:this={dialog}
  class="picker"
  aria-labelledby="add-to-setlist-title"
  onpointerdown={() => (armed = true)}
  onclickcapture={(e) => {
    if (armed || e.detail === 0) return // e.detail 0: keyboard
    e.preventDefault()
    e.stopPropagation()
  }}
  onclick={(e) => e.target === dialog && dialog.close()}
>
<div class="sheet">
  <h2 id="add-to-setlist-title">{tune?.title}</h2>
  {#if already}
    <p class="already">
      Already on the active setlist, {already.name}.
      <a href="#/setlists/{already.id}" onclick={() => dialog.close()}>Open</a>
    </p>
  {/if}
  <ul>
    {#each choices as s (s.id)}
      <li>
        <button class="choice" disabled={busy} onclick={() => add(s)}>
          <span class="name"><Icon name="plus" size={16} /> Add to {s.name}</span>
          <span class="muted">
            {[formatDate(s.showDate), `${s.tuneCount} ${s.tuneCount === 1 ? 'tune' : 'tunes'}`, s.hasTune && 'already has it']
              .filter(Boolean)
              .join(' · ')}
          </span>
        </button>
      </li>
    {:else}
      {#if !already}
        <li class="muted empty">No active setlists. <a href="#/setlists" onclick={() => dialog.close()}>Go to Setlists</a></li>
      {/if}
    {/each}
  </ul>
  <button class="cancel" onclick={() => dialog.close()}>{already ? 'Close' : 'Cancel'}</button>
</div>
</dialog>

<div class="toast-region" role="status" aria-live="polite">
  {#if toast}
    <div class="toast" class:error={toast.error}>
      <Icon name={toast.error ? 'close' : 'setlists'} size={18} />
      <span>{toast.text}</span>
      {#if toast.href}<a href={toast.href} onclick={() => (toast = null)}>{toast.link}</a>{/if}
    </div>
  {/if}
</div>

<style>
  /* The dialog itself has no padding, so only taps outside the sheet count as the backdrop. */
  .picker {
    width: min(26rem, calc(100vw - 2rem));
    max-height: min(32rem, calc(100dvh - 4rem));
    padding: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg-raised);
    color: var(--text);
    box-shadow: 0 12px 32px var(--shadow);
  }
  .sheet {
    padding: 1rem;
  }
  .picker::backdrop {
    background: var(--backdrop);
  }
  h2 {
    margin: 0 0 0.75rem;
    font-size: 1.1rem;
  }
  ul {
    display: grid;
    gap: 0.5rem;
    margin: 0 0 0.75rem;
    padding: 0;
    list-style: none;
  }
  .choice {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.1rem;
    padding: 0.6rem 0.75rem;
    text-align: left;
  }
  .name {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 700;
  }
  .name :global(svg) {
    flex: none;
    color: var(--accent);
  }
  .choice .muted {
    padding-left: calc(16px + 0.4rem); /* lines up with the name after the + icon */
    font-size: 0.85rem;
    font-weight: 400;
  }
  .empty {
    padding: 0.25rem 0;
  }
  .already {
    margin: 0 0 0.75rem;
  }
  .cancel {
    width: 100%;
  }

  .toast-region {
    position: fixed;
    inset: auto 1rem calc(1rem + env(safe-area-inset-bottom)) 1rem;
    z-index: 50;
    display: flex;
    justify-content: center;
    pointer-events: none;
  }
  .toast {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    max-width: 32rem;
    padding: 0.7rem 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg-raised);
    color: var(--text);
    box-shadow: 0 8px 24px var(--shadow);
    pointer-events: auto;
  }
  .toast :global(svg) {
    flex: none;
    color: var(--accent);
  }
  .toast.error {
    border-color: var(--danger);
  }
  .toast.error :global(svg) {
    color: var(--danger);
  }
  .toast a {
    margin-left: auto;
    font-weight: 700;
    white-space: nowrap;
  }
</style>
