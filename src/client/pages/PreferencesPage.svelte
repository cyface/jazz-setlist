<script>
  import ChoiceGroup from '../components/ChoiceGroup.svelte'
  import TuneBadges from '../components/TuneBadges.svelte'
  import { ENTRY_OPTIONS, FEEL_OPTIONS, IMPLEMENT_OPTIONS } from '../lib/choices.js'
  import { savePreferences, session } from '../lib/session.svelte.js'
  import { TIME_SIGNATURES, parseTimeSignature } from '../../shared/attributes.js'

  let form = $state($state.snapshot(session.preferences))
  let saving = $state(false)
  let status = $state('')
  let error = $state('')

  // A tune that matches the defaults, and one that differs in implement, entry and time signature.
  const samples = $derived.by(() => {
    const d = form.defaults
    const usual = { feel: d.feel, drumImplement: d.drumImplement, drumsEntry: d.drumsEntry, ...parseTimeSignature(d.timeSignature) }
    const other = d.timeSignature === '6/8' ? '3/4' : '6/8'
    return [
      usual,
      { ...usual, drumImplement: d.drumImplement === 'sticks' ? 'brushes' : 'sticks', drumsEntry: 'later', ...parseTimeSignature(other) },
    ]
  })

  const dirty = $derived(JSON.stringify(form) !== JSON.stringify(session.preferences))

  async function save(e) {
    e.preventDefault()
    saving = true
    error = ''
    try {
      await savePreferences($state.snapshot(form))
      status = 'Saved.'
    } catch (err) {
      error = err.message
    } finally {
      saving = false
    }
  }
</script>

<section class="narrow">
  <h1>Preferences</h1>

  <form class="form" onsubmit={save} oninput={() => (status = '')}>
    <section>
      <h2>Defaults</h2>
      <p class="muted hint">New tunes start with these.</p>
      <div class="defaults">
        <ChoiceGroup legend="Feel" name="default-feel" options={FEEL_OPTIONS} bind:value={form.defaults.feel} />
        <ChoiceGroup legend="Drums play with" name="default-implement" options={IMPLEMENT_OPTIONS} bind:value={form.defaults.drumImplement} />
        <ChoiceGroup legend="Drums" name="default-entry" options={ENTRY_OPTIONS} bind:value={form.defaults.drumsEntry} />
        <label class="field signature-field">
          <span>Time signature</span>
          <select bind:value={form.defaults.timeSignature}>
            {#each TIME_SIGNATURES as sig (sig)}<option value={sig}>{sig}</option>{/each}
          </select>
        </label>
      </div>
    </section>

    <section class="list-view">
      <h2>List view</h2>
      <label class="toggle">
        <input type="checkbox" bind:checked={form.hideDefaults} />
        <span>
          <strong>Hide defaults in list views</strong>
          <span class="muted">Tune and setlist lists show only what differs from your defaults, so the exceptions stand out.</span>
        </span>
      </label>

      <div class="preview">
        <span class="muted">Preview</span>
        {#each samples as sample, i (i)}
          <div class="row">
            <span class="title">{i === 0 ? 'Usual tune' : 'Different tune'}</span>
            <TuneBadges arrangement={{ ...sample, soloOrder: [] }} compact preferences={form} />
          </div>
        {/each}
      </div>
    </section>

    {#if error}<p class="error">{error}</p>{/if}
    <div class="actions">
      <button class="primary" type="submit" disabled={saving || !dirty}>{saving ? 'Saving…' : 'Save preferences'}</button>
      {#if status}<span class="muted" role="status">{status}</span>{/if}
    </div>
  </form>
</section>

<style>
  h2 {
    margin: 0 0 0.25rem;
    font-size: 1.15rem;
  }
  .hint {
    margin: 0 0 0.75rem;
  }
  .list-view {
    display: grid;
    gap: 0.75rem;
  }
  .list-view h2 {
    margin: 0;
  }
  .defaults {
    display: grid;
    gap: 1rem;
  }
  .toggle {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
  }
  .toggle input {
    width: 1.25rem;
    height: 1.25rem;
    min-height: 0;
    margin: 0.15rem 0 0;
    accent-color: var(--accent);
  }
  .toggle > span {
    display: grid;
    gap: 0.15rem;
  }
  .preview {
    display: grid;
    gap: 0.4rem;
  }
  .title {
    font-weight: 700;
    margin-right: auto;
  }
  .preview .row {
    min-height: 3.25rem;
  }
  .signature-field {
    max-width: 12rem;
  }
  .actions {
    align-items: center;
  }
</style>
