<script>
  import Icon from './Icon.svelte'
  import { LABELS, describeSoloEntry, soloEntryHasDrums, timeSignature } from '../../shared/attributes.js'
  import { isHiddenDefault } from '../../shared/preferences.js'
  import { session } from '../lib/session.svelte.js'

  /** compact: icon-only chips for list rows; otherwise icon + label. In compact mode, attributes that equal
      the user's defaults are left out when the "hide defaults" preference is on (`preferences` overrides the
      saved ones, for previews). */
  let { arrangement, compact = false, preferences = undefined } = $props()

  const drumSolos = $derived(arrangement.soloOrder.filter(soloEntryHasDrums))
  const signature = $derived(timeSignature(arrangement))
  const value = (key) => (key === 'timeSignature' ? signature : arrangement[key])
  const show = (key) => !compact || !isHiddenDefault(preferences ?? session.preferences, key, value(key))
</script>

<ul class="badges" class:compact>
  {#if show('timeSignature')}
    <li class="badge meter" title={compact ? `${signature} time` : undefined}>
      <span class="signature" aria-label="{signature} time">{signature}</span>
    </li>
  {/if}
  {#if show('feel')}
    <li class="badge feel-{arrangement.feel}">
      <Icon name={arrangement.feel} title={compact ? LABELS.feel[arrangement.feel] : undefined} />
      {#if !compact}<span>{LABELS.feel[arrangement.feel]}</span>{/if}
    </li>
  {/if}
  {#if show('drumImplement')}
    <li class="badge implement-{arrangement.drumImplement}">
      <Icon name={arrangement.drumImplement} title={compact ? LABELS.drumImplement[arrangement.drumImplement] : undefined} />
      {#if !compact}<span>{LABELS.drumImplement[arrangement.drumImplement]}</span>{/if}
    </li>
  {/if}
  {#if show('drumsEntry')}
    <li class="badge entry-{arrangement.drumsEntry}">
      <Icon
        name={arrangement.drumsEntry === 'top' ? 'drum' : 'drum-later'}
        title={compact ? LABELS.drumsEntry[arrangement.drumsEntry] : undefined}
      />
      {#if !compact}<span>{arrangement.drumsEntry === 'top' ? 'Drums from top' : 'Drums in later'}</span>{/if}
    </li>
  {/if}
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
  .meter { color: var(--c-meter); }
  .signature {
    min-width: 1.4rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }
  .meter {
    padding-left: 0.6rem;
  }
  .compact .meter {
    padding: 0.2rem 0.45rem;
    font-size: 0.8rem;
  }
</style>
