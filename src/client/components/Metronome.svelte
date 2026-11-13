<script>
  import { onDestroy } from 'svelte'
  import Icon from './Icon.svelte'
  import { createMetronome, isAccent } from '../lib/metronome.js'

  let { tempo, beatsPerBar = 4 } = $props()

  // Starts at the arrangement's tempo; nudges here are not saved.
  let bpm = $derived(tempo)
  let accent = $state('one')
  let playing = $state(false)
  let active = $state(-1)
  let wakeLock

  const metronome = createMetronome({
    getSettings: () => ({ bpm, beatsPerBar, accent }),
    onBeat: (beat) => (active = beat),
  })

  async function start() {
    await metronome.start()
    playing = true
    wakeLock = await navigator.wakeLock?.request('screen').catch(() => undefined)
  }

  function stop() {
    metronome.stop()
    playing = false
    wakeLock?.release()
    wakeLock = undefined
  }

  const toggle = () => (playing ? stop() : start())
  const nudge = (delta) => (bpm = Math.min(400, Math.max(20, bpm + delta)))

  function onKeydown(e) {
    if (e.code !== 'Space' || e.target.closest('input, textarea, select, button')) return
    e.preventDefault()
    toggle()
  }

  onDestroy(() => {
    stop()
    metronome.destroy()
  })
</script>

<svelte:window onkeydown={onKeydown} />

<section class="metronome" aria-label="Metronome">
  <div class="beats" style:--beats={beatsPerBar}>
    {#each { length: beatsPerBar } as _, i (i)}
      <div class="beat" class:on={active === i} class:accent={isAccent(i, beatsPerBar, accent)}>
        <span>{i + 1}</span>
      </div>
    {/each}
  </div>

  <div class="controls">
    <button class="play" class:playing onclick={toggle} aria-label={playing ? 'Stop metronome' : 'Start metronome'}>
      <Icon name={playing ? 'stop' : 'play'} size={28} />
    </button>
    <div class="tempo">
      <button onclick={() => nudge(-1)} aria-label="Slower">−</button>
      <output aria-live="polite"><strong>{bpm}</strong> bpm</output>
      <button onclick={() => nudge(1)} aria-label="Faster">+</button>
    </div>
    {#if beatsPerBar % 2 === 0}
      <div class="accent-choice" role="group" aria-label="Accent">
        <button class:selected={accent === 'one'} aria-pressed={accent === 'one'} onclick={() => (accent = 'one')}>Accent 1</button>
        <button class:selected={accent === 'two-four'} aria-pressed={accent === 'two-four'} onclick={() => (accent = 'two-four')}>2 &amp; 4</button>
      </div>
    {/if}
  </div>
</section>

<style>
  .metronome {
    display: grid;
    gap: 1rem;
    padding: 1rem;
    border-radius: var(--radius);
    background: var(--bg-raised);
    border: 1px solid var(--border);
  }
  .beats {
    display: grid;
    grid-template-columns: repeat(var(--beats), 1fr);
    gap: 0.5rem;
  }
  .beat {
    display: grid;
    place-items: end start;
    aspect-ratio: 1;
    max-height: 7rem;
    padding: 0.4rem 0.5rem;
    border-radius: 0.5rem;
    background: var(--beat-off);
    color: var(--text-muted);
    font-size: 0.85rem;
    font-weight: 700;
    transition: background 120ms ease-out, transform 120ms ease-out;
  }
  .beat.accent {
    outline: 2px solid var(--beat-accent);
    outline-offset: -2px;
  }
  .beat.on {
    background: var(--beat-on);
    color: var(--bg);
    transform: scale(1.04);
    transition: none;
  }
  .beat.on.accent {
    background: var(--beat-accent);
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }
  .play {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    background: var(--accent);
    color: var(--bg);
    border: none;
  }
  .play.playing {
    background: var(--danger);
  }
  .tempo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .tempo button {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.25rem;
  }
  output strong {
    font-size: 1.5rem;
    font-variant-numeric: tabular-nums;
  }
  .accent-choice {
    display: flex;
    margin-left: auto;
  }
  .accent-choice button {
    border-radius: 0;
  }
  .accent-choice button:first-child {
    border-radius: var(--radius) 0 0 var(--radius);
  }
  .accent-choice button:last-child {
    border-radius: 0 var(--radius) var(--radius) 0;
  }
  .accent-choice button.selected {
    position: relative;
    border-color: var(--accent);
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, var(--bg-raised));
  }
  /* Phones: a big start/stop on its own line, easy to hit on a gig; the tempo row goes below. */
  @media (max-width: 767.98px) {
    .play {
      flex: 1 0 100%;
      height: 4.5rem;
      border-radius: var(--radius);
    }
    .play :global(.icon) {
      width: 2.75rem;
      height: 2.75rem;
    }
    /* Tempo and accent don't fit side by side at phone widths; each takes a full row. */
    .tempo,
    .accent-choice {
      flex: 1 0 100%;
      margin-left: 0;
    }
    .tempo {
      justify-content: space-between;
    }
    .tempo button {
      width: 3rem;
      height: 3rem;
    }
    .accent-choice button {
      flex: 1;
    }
  }
</style>
