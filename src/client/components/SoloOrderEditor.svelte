<script>
  import Icon from './Icon.svelte'
  import { INSTRUMENTS, LABELS, TRADE_BARS, soloEntryIcons } from '../../shared/attributes.js'
  import { moveItem } from '../../shared/setlist.js'

  let { soloOrder = $bindable() } = $props()

  const templates = {
    solo: () => ({ type: 'solo', instrument: '' }),
    trade: () => ({ type: 'trade', instruments: ['drums', 'bass'], bars: 4 }),
    over_head: () => ({ type: 'over_head', instrument: 'drums' }),
  }

  const add = (type) => soloOrder.push(templates[type]())
  const remove = (i) => soloOrder.splice(i, 1)
  const move = (i, to) => (soloOrder = moveItem(soloOrder, i, to))
</script>

<datalist id="instrument-options">
  {#each INSTRUMENTS as instrument (instrument)}<option value={instrument}></option>{/each}
</datalist>

<ol class="editor">
  {#each soloOrder as entry, i (entry)}
    <li>
      <span class="n">{i + 1}</span>
      <span class="type">
        {#each soloEntryIcons(entry) as icon (icon)}<Icon name={icon} />{/each}
        {LABELS.soloType[entry.type]}
      </span>

      <div class="fields">
        {#if entry.type === 'trade'}
          {#each entry.instruments as _, j (j)}
            <input
              list="instrument-options"
              bind:value={entry.instruments[j]}
              aria-label="Trading instrument {j + 1}"
              required
            />
            {#if entry.instruments.length > 2}
              <button type="button" class="icon-button" onclick={() => entry.instruments.splice(j, 1)} aria-label="Remove instrument">
                <Icon name="close" size={16} />
              </button>
            {/if}
          {/each}
          <button type="button" class="icon-button" onclick={() => entry.instruments.push('')} aria-label="Add instrument to trade">
            <Icon name="plus" size={16} />
          </button>
          <select bind:value={entry.bars} aria-label="Bars per trade">
            {#each TRADE_BARS as bars (bars)}<option value={bars}>{bars}s</option>{/each}
          </select>
        {:else}
          <input list="instrument-options" bind:value={entry.instrument} aria-label="Instrument" required />
        {/if}
      </div>

      <div class="row-actions">
        <button type="button" class="icon-button" onclick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">
          <Icon name="up" size={18} />
        </button>
        <button type="button" class="icon-button" onclick={() => move(i, i + 1)} disabled={i === soloOrder.length - 1} aria-label="Move down">
          <Icon name="down" size={18} />
        </button>
        <button type="button" class="icon-button" onclick={() => remove(i)} aria-label="Remove">
          <Icon name="close" size={18} />
        </button>
      </div>
    </li>
  {/each}
</ol>

<div class="add">
  <button type="button" onclick={() => add('solo')}><Icon name="solo" size={18} /> Add solo</button>
  <button type="button" onclick={() => add('trade')}><Icon name="trade" size={18} /> Add trade</button>
  <button type="button" onclick={() => add('over_head')}><Icon name="over_head" size={18} /> Solo over head out</button>
</div>

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
  .n {
    font-weight: 700;
    width: 1.5rem;
    text-align: center;
  }
  .type {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    min-width: 9rem;
    color: var(--c-solo);
    font-weight: 600;
  }
  .fields {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    flex: 1;
  }
  .fields input {
    width: 8rem;
  }
  .row-actions {
    display: flex;
    gap: 0.25rem;
    margin-left: auto;
  }
  .add {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
</style>
