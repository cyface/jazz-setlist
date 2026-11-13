<script>
  import { tick } from 'svelte'
  import ArrangementDetail from '../components/ArrangementDetail.svelte'
  import Icon from '../components/Icon.svelte'
  import TuneBadges from '../components/TuneBadges.svelte'
  import TuneSearch from '../components/TuneSearch.svelte'
  import { api } from '../lib/api.js'
  import { navigate } from '../lib/router.js'
  import { recallPosition, rememberPosition } from '../lib/setlist-position.js'
  import { moveItem, numberSets } from '../../shared/setlist.js'

  let { id } = $props()

  let setlist = $state(null)
  let items = $state([])
  let arrangements = $state([])
  let error = $state('')
  let saving = $state(false)
  let selectedKey = $state(null)
  /** The tune opened most recently; stays highlighted in the list after going back to it. */
  let lastKey = $state(null)
  let listEl = $state()
  let editingInfo = $state(false)
  let info = $state({ name: '', showDate: '', venue: '', notes: '' })

  const numbered = $derived(numberSets(items))
  const tunes = $derived(numbered.filter((i) => i.kind === 'tune'))
  const selectedIndex = $derived(tunes.findIndex((t) => t.key === selectedKey))
  const selected = $derived(tunes[selectedIndex])
  const next = $derived(tunes[selectedIndex + 1])
  const inSetlist = $derived(new Set(tunes.map((t) => t.arrangement.id)))

  const toLocal = (item) => ({ key: item.id ?? crypto.randomUUID(), kind: item.kind, label: item.label ?? '', arrangement: item.arrangement })

  function load() {
    Promise.all([api.getSetlist(id), api.listArrangements()])
      .then(([s, a]) => {
        setlist = s
        items = s.items.map(toLocal)
        arrangements = a
        info = { name: s.name, showDate: s.showDate ?? '', venue: s.venue ?? '', notes: s.notes ?? '' }
        lastKey = recallPosition(id, tunes)
        revealCurrent()
      })
      .catch((e) => (error = e.message))
  }
  load()

  function select(key) {
    selectedKey = key
    lastKey = key
    rememberPosition(id, tunes, key)
    revealCurrent()
  }

  function backToList() {
    selectedKey = null
    revealCurrent()
  }

  /** Scrolls the highlighted tune into view (after the list is shown again on phones). */
  async function revealCurrent() {
    await tick()
    listEl?.querySelector('.row.active')?.scrollIntoView({ block: 'nearest' })
  }

  // Saves replace all items, so they run one at a time, in order, each sending the items as they are by then.
  let saveQueue = Promise.resolve()
  let pendingSaves = 0
  function saveItems() {
    pendingSaves += 1
    saving = true
    error = ''
    saveQueue = saveQueue
      .then(() =>
        api.saveSetlistItems(
          id,
          items.map((i) => (i.kind === 'tune' ? { kind: 'tune', arrangementId: i.arrangement.id } : { kind: 'break', label: i.label })),
        ),
      )
      .catch((e) => {
        error = e.message
        load()
      })
      .finally(() => {
        pendingSaves -= 1
        saving = pendingSaves > 0
      })
  }

  function addTune(arrangement) {
    items.push({ key: crypto.randomUUID(), kind: 'tune', label: '', arrangement })
    saveItems()
  }

  function addBreak() {
    items.push({ key: crypto.randomUUID(), kind: 'break', label: '', arrangement: null })
    saveItems()
  }

  function move(index, to) {
    items = moveItem(items, index, to)
    saveItems()
  }

  function remove(index) {
    items.splice(index, 1)
    saveItems()
  }

  async function saveInfo(e) {
    e.preventDefault()
    try {
      setlist = await api.updateSetlist(id, $state.snapshot(info))
      editingInfo = false
    } catch (err) {
      error = err.message
    }
  }

  async function toggleArchived() {
    error = ''
    try {
      setlist = await api.setSetlistArchived(id, !setlist.archivedAt)
    } catch (err) {
      error = err.message
    }
  }

  async function deleteSetlist() {
    if (!confirm(`Delete setlist “${setlist.name}”? Tunes are kept.`)) return
    await api.deleteSetlist(id)
    navigate('/setlists')
  }

  const formatDate = (d) =>
    d ? new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''
  const startsSet = (index) => numbered[index].kind === 'tune' && numbered[index].number === 1
</script>

{#if error}<p class="error">{error}</p>{/if}

{#if setlist}
  <div class="split" class:has-selection={selected}>
    <section class="list-pane">
      {#if editingInfo}
        <form class="form" onsubmit={saveInfo}>
          <label class="field"><span>Name</span><input bind:value={info.name} required maxlength="200" /></label>
          <div class="grid">
            <label class="field"><span>Date</span><input type="date" bind:value={info.showDate} /></label>
            <label class="field"><span>Venue</span><input bind:value={info.venue} maxlength="200" /></label>
          </div>
          <label class="field"><span>Notes</span><textarea bind:value={info.notes} rows="3" maxlength="5000"></textarea></label>
          <div class="actions">
            <button class="primary" type="submit">Save</button>
            <button type="button" onclick={() => (editingInfo = false)}>Cancel</button>
            <!-- Archive lives here, not in the toolbar, so it's hard to hit by accident. -->
            <button
              type="button"
              onclick={toggleArchived}
              title={setlist.archivedAt ? 'Move back to active setlists' : 'Keep it, but hide it from active setlists'}
            >
              <Icon name={setlist.archivedAt ? 'unarchive' : 'archive'} size={18} />
              {setlist.archivedAt ? 'Restore setlist' : 'Archive setlist'}
            </button>
            <button type="button" class="danger" onclick={deleteSetlist}>Delete setlist</button>
          </div>
        </form>
      {:else}
        <div class="toolbar">
          <div>
            <h1>{setlist.name}</h1>
            <p class="muted">{[formatDate(setlist.showDate), setlist.venue].filter(Boolean).join(' · ')}</p>
            {#if setlist.archivedAt}
              <p class="archived-tag"><Icon name="archive" size={16} /> Archived</p>
            {/if}
          </div>
          <div class="toolbar-actions">
            <button onclick={() => (editingInfo = true)}><Icon name="edit" size={18} /> Edit</button>
          </div>
        </div>
        {#if setlist.notes}<p class="notes">{setlist.notes}</p>{/if}
      {/if}

      <ol class="setlist" aria-busy={saving} bind:this={listEl}>
        {#each numbered as item, index (item.key)}
          {#if startsSet(index)}
            <li class="set-heading" aria-hidden="true">Set {item.set}</li>
          {/if}
          {#if item.kind === 'tune'}
            <li class="row tune" class:active={item.key === (selectedKey ?? lastKey)}>
              <button class="select" onclick={() => select(item.key)} aria-current={item.key === (selectedKey ?? lastKey) ? 'true' : undefined}>
                <span class="head">
                  <span class="n">{item.number}</span>
                  <span class="title">{item.arrangement.title}</span>
                </span>
                <span class="meta">
                  <TuneBadges arrangement={item.arrangement} compact />
                  <span class="tempo" title="Tempo (bpm)">{item.arrangement.tempo}<span class="sr-only">&nbsp;bpm</span></span>
                </span>
              </button>
              {@render rowActions(index)}
            </li>
          {:else}
            <li class="row set-break">
              <Icon name="break" title="Set break" />
              <span class="break-label">Set break</span>
              <input
                class="break-note"
                bind:value={items[index].label}
                onchange={saveItems}
                placeholder="Note (e.g. 20 min)"
                maxlength="100"
                aria-label="Set break note"
              />
              {@render rowActions(index)}
            </li>
          {/if}
        {/each}
      </ol>

      <div class="add-bar">
        <TuneSearch {arrangements} {inSetlist} onpick={addTune} />
        <button onclick={addBreak}><Icon name="break" size={18} /> Add set break</button>
      </div>
    </section>

    {#if selected}
      <section class="detail-pane">
        <div class="stepper">
          <button onclick={backToList} class="back-button"><Icon name="left" size={18} /> Setlist</button>
          <button onclick={() => select(tunes[selectedIndex - 1].key)} disabled={selectedIndex === 0}>
            <Icon name="left" size={18} /> Prev
          </button>
          <button class="next" onclick={() => select(next.key)} disabled={!next} title={next?.arrangement.title}>
            {#if next}
              <span class="next-title">
                Next{next.set !== selected.set ? ` (set ${next.set})` : ''}: <strong>{next.arrangement.title}</strong>
              </span>
            {:else}
              Last tune
            {/if}
            <Icon name="right" size={18} />
          </button>
        </div>
        <ArrangementDetail arrangement={selected.arrangement} heading="Set {selected.set} · Tune {selected.number}" />
      </section>
    {/if}
  </div>
{/if}

{#snippet rowActions(index)}
  <span class="row-actions">
    <button class="icon-button" onclick={() => move(index, index - 1)} disabled={index === 0} aria-label="Move up">
      <Icon name="up" size={18} />
    </button>
    <button class="icon-button" onclick={() => move(index, index + 1)} disabled={index === items.length - 1} aria-label="Move down">
      <Icon name="down" size={18} />
    </button>
    <button class="icon-button" onclick={() => remove(index)} aria-label="Remove from setlist">
      <Icon name="close" size={18} />
    </button>
  </span>
{/snippet}

<style>
  .toolbar-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.4rem;
  }
  .archived-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.1rem 0.6rem;
    border-radius: 999px;
    background: var(--chip);
    color: var(--text-muted);
    font-size: 0.85rem;
    font-weight: 600;
  }
  .setlist {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.4rem;
    margin: 1rem 0;
    padding: 0;
    list-style: none;
  }
  .set-heading {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .tune {
    padding: 0;
  }
  .select {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    gap: 0.6rem;
    flex: 1;
    min-width: 0;
    padding: 0.6rem 0.75rem;
    border: none;
    background: none;
    text-align: left;
    color: inherit;
  }
  /* Number + title: one item, so a long title wraps its own text beside the
     number instead of dropping onto a line of its own. */
  .head {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    flex: 1 1 auto; /* fills the row so the tempo sits at the right edge */
    min-width: 0;
  }
  .n {
    flex: none;
    width: 1.5rem;
    color: var(--text-muted);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .title {
    min-width: 0;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  /* Badges + tempo wrap together and stay at the right edge. */
  .meta {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-left: auto;
  }
  .tempo {
    min-width: 3ch; /* right-aligned in a fixed width so 2- and 3-digit tempos line up */
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  .row-actions {
    display: flex;
    gap: 0.2rem;
    padding-right: 0.4rem;
  }
  .set-break {
    border-style: dashed;
    color: var(--accent);
  }
  .break-label {
    font-weight: 700;
    white-space: nowrap;
  }
  .break-note {
    flex: 1;
    min-width: 6rem;
    background: transparent;
  }
  .add-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.75rem 1.25rem;
    margin-top: 0.5rem;
  }
  .stepper {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  /* Sized to the next tune's name; wraps to its own row when it doesn't fit, and truncates past that. */
  .next {
    flex: 0 1 auto;
    min-width: 0;
  }
  .next :global(svg) {
    flex: none;
  }
  .next-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .notes {
    white-space: pre-wrap;
  }
</style>
