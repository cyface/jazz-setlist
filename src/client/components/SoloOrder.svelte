<script>
  import Icon from './Icon.svelte'
  import { LABELS, describeSoloEntry, soloEntryHasDrums } from '../../shared/attributes.js'

  let { soloOrder } = $props()
</script>

{#if soloOrder.length}
  <ol class="solo-order">
    {#each soloOrder as entry, i (i)}
      <li class:drums={soloEntryHasDrums(entry)}>
        <span class="n">{i + 1}</span>
        <Icon name={entry.type} title={LABELS.soloType[entry.type]} />
        <span>{describeSoloEntry(entry)}</span>
      </li>
    {/each}
  </ol>
{:else}
  <p class="muted">No solos set.</p>
{/if}

<style>
  .solo-order {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.75rem 0.35rem 0.35rem;
    border-radius: var(--radius);
    background: var(--bg-raised);
    border: 1px solid var(--border);
    font-weight: 600;
  }
  li.drums {
    border-color: var(--c-solo);
    color: var(--c-solo);
  }
  .n {
    display: grid;
    place-items: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background: var(--border);
    color: var(--text);
    font-size: 0.8rem;
  }
</style>
