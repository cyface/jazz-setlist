<script>
  import Icon from './Icon.svelte'
  import Metronome from './Metronome.svelte'
  import SoloOrder from './SoloOrder.svelte'
  import TuneBadges from './TuneBadges.svelte'

  let { arrangement, heading = undefined } = $props()
</script>

<article class="detail">
  <header>
    {#if heading}<p class="eyebrow">{heading}</p>{/if}
    <h2>{arrangement.title}</h2>
    <p class="meta">
      {[arrangement.composer, arrangement.musicalKey && `Key of ${arrangement.musicalKey}`]
        .filter(Boolean)
        .join(' · ')}
    </p>
    <a class="button edit" href="#/arrangements/{arrangement.id}/edit"><Icon name="edit" size={18} /> Edit</a>
  </header>

  {#key arrangement.id}
    <Metronome tempo={arrangement.tempo} beatsPerBar={arrangement.beatsPerBar} />
  {/key}

  <TuneBadges {arrangement} />
  {#if arrangement.drumsEntry === 'later' && arrangement.drumsEntryNote}
    <p class="entry-note"><strong>Drums come in:</strong> {arrangement.drumsEntryNote}</p>
  {/if}

  <section>
    <h3>Solo order</h3>
    <SoloOrder soloOrder={arrangement.soloOrder} />
  </section>

  {#if arrangement.notes}
    <section>
      <h3>Notes</h3>
      <p class="notes">{arrangement.notes}</p>
    </section>
  {/if}
</article>

<style>
  .detail {
    display: grid;
    gap: 1.25rem;
  }
  header {
    position: relative;
    padding-right: 6rem;
  }
  h2 {
    margin: 0;
    font-size: 1.9rem;
  }
  .meta {
    margin: 0.25rem 0 0;
    color: var(--text-muted);
  }
  .eyebrow {
    margin: 0 0 0.2rem;
    color: var(--accent);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.8rem;
  }
  .edit {
    position: absolute;
    top: 0;
    right: 0;
  }
  h3 {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
  }
  .entry-note {
    margin: 0;
  }
  .notes {
    margin: 0;
    white-space: pre-wrap;
  }
</style>
