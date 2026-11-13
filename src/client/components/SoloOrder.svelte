<script>
  import Icon from './Icon.svelte'
  import { LABELS, describeSoloEntry, soloEntryHasDrums, soloEntryIcons } from '../../shared/attributes.js'

  let { soloOrder } = $props()

  /** Accessible name for a chip's icons: who solos and how ("Piano solo", "Drums over the head out"). */
  const iconLabel = (entry) =>
    entry.type === 'solo' ? `${describeSoloEntry(entry)} solo` : entry.type === 'trade' ? LABELS.soloType.trade : describeSoloEntry(entry)
</script>

{#if soloOrder.length}
  <ol class="solo-order">
    {#each soloOrder as entry, i (i)}
      <li class:drums={soloEntryHasDrums(entry)}>
        <span class="n">{i + 1}</span>
        <span class="icons" role="img" aria-label={iconLabel(entry)} title={iconLabel(entry)}>
          {#each soloEntryIcons(entry) as icon (icon)}<Icon name={icon} />{/each}
        </span>
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
  .icons {
    display: inline-flex;
    gap: 0.15rem;
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
