<script>
  import Icon from './Icon.svelte'
  import { LABELS, describeSoloEntry, soloEntryHasDrums } from '../../shared/attributes.js'

  /** compact: icon-only chips for list rows; otherwise icon + label. */
  let { arrangement, compact = false } = $props()

  const drumSolos = $derived(arrangement.soloOrder.filter(soloEntryHasDrums))
</script>

<ul class="badges" class:compact>
  <li class="badge feel-{arrangement.feel}">
    <Icon name={arrangement.feel} title={compact ? LABELS.feel[arrangement.feel] : undefined} />
    {#if !compact}<span>{LABELS.feel[arrangement.feel]}</span>{/if}
  </li>
  <li class="badge implement-{arrangement.drumImplement}">
    <Icon name={arrangement.drumImplement} title={compact ? LABELS.drumImplement[arrangement.drumImplement] : undefined} />
    {#if !compact}<span>{LABELS.drumImplement[arrangement.drumImplement]}</span>{/if}
  </li>
  <li class="badge entry-{arrangement.drumsEntry}">
    <Icon
      name={arrangement.drumsEntry === 'top' ? 'drum' : 'drum-later'}
      title={compact ? LABELS.drumsEntry[arrangement.drumsEntry] : undefined}
    />
    {#if !compact}<span>{arrangement.drumsEntry === 'top' ? 'Drums from top' : 'Drums in later'}</span>{/if}
  </li>
  {#if compact}
    {#each drumSolos as entry, i (i)}
      <li class="badge solo-{entry.type}">
        <Icon name={entry.type} title={describeSoloEntry(entry)} />
      </li>
    {/each}
  {/if}
</ul>

<style>
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.6rem 0.25rem 0.4rem;
    border-radius: 999px;
    border: 1px solid currentColor;
    font-size: 0.85rem;
    font-weight: 600;
    background: color-mix(in srgb, currentColor 12%, transparent);
  }
  .compact .badge {
    padding: 0.2rem;
  }
  .feel-swing { color: var(--c-swing); }
  .feel-straight { color: var(--c-straight); }
  .implement-sticks { color: var(--c-sticks); }
  .implement-brushes { color: var(--c-brushes); }
  .entry-top { color: var(--c-drums-top); }
  .entry-later { color: var(--c-drums-later); }
  .solo-solo, .solo-trade, .solo-over_head { color: var(--c-solo); }
</style>
