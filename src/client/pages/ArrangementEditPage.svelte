<script>
  import ChoiceGroup from '../components/ChoiceGroup.svelte'
  import SoloOrderEditor from '../components/SoloOrderEditor.svelte'
  import { api } from '../lib/api.js'
  import { tapTempo } from '../lib/metronome.js'
  import { navigate } from '../lib/router.js'
  import { BEATS_PER_BAR_OPTIONS, LABELS } from '../../shared/attributes.js'

  let { id } = $props()

  const blank = () => ({
    title: '',
    composer: '',
    musicalKey: '',
    tempo: 120,
    beatsPerBar: 4,
    feel: 'swing',
    drumImplement: 'sticks',
    drumsEntry: 'top',
    drumsEntryNote: '',
    soloOrder: [],
    notes: '',
  })

  let form = $state(blank())
  let loading = $state(true)
  let saving = $state(false)
  let error = $state('')
  let taps = []

  async function load() {
    try {
      if (!id) return
      const a = await api.getArrangement(id)
      form = { ...blank(), ...Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v ?? ''])) }
    } catch (e) {
      error = e.message
    } finally {
      loading = false
    }
  }
  load()

  const feelOptions = [
    { value: 'swing', label: LABELS.feel.swing, icon: 'swing' },
    { value: 'straight', label: LABELS.feel.straight, icon: 'straight' },
  ]
  const implementOptions = [
    { value: 'sticks', label: LABELS.drumImplement.sticks, icon: 'sticks' },
    { value: 'brushes', label: LABELS.drumImplement.brushes, icon: 'brushes' },
  ]
  const entryOptions = [
    { value: 'top', label: 'From the top', icon: 'drum' },
    { value: 'later', label: 'Come in later', icon: 'drum-later' },
  ]

  function tap() {
    const result = tapTempo(taps, performance.now())
    taps = result.taps
    if (result.bpm && result.bpm >= 20 && result.bpm <= 400) form.tempo = result.bpm
  }

  async function save(e) {
    e.preventDefault()
    saving = true
    error = ''
    try {
      const payload = { ...$state.snapshot(form), tempo: Number(form.tempo), beatsPerBar: Number(form.beatsPerBar) }
      const saved = id ? await api.updateArrangement(id, payload) : await api.createArrangement(payload)
      navigate(`/arrangements/${saved.id}`)
    } catch (err) {
      error = err.message
    } finally {
      saving = false
    }
  }

  async function remove() {
    if (!confirm(`Delete “${form.title}”? It will also be removed from any setlists.`)) return
    try {
      await api.deleteArrangement(id)
      navigate('/')
    } catch (err) {
      error = err.message
    }
  }
</script>

<section class="narrow">
  <h1>{id ? 'Edit tune' : 'New tune'}</h1>

  {#if loading}
    <p class="muted">Loading…</p>
  {:else}
    <form onsubmit={save} class="form">
      <label class="field wide">
        <span>Title</span>
        <input bind:value={form.title} required maxlength="200" />
      </label>
      <div class="grid">
        <label class="field">
          <span>Composer</span>
          <input bind:value={form.composer} maxlength="200" />
        </label>
        <label class="field">
          <span>Key</span>
          <input bind:value={form.musicalKey} maxlength="20" placeholder="e.g. Bb, Gm" />
        </label>
        <label class="field">
          <span>Tempo (bpm)</span>
          <span class="inline">
            <input type="number" bind:value={form.tempo} min="20" max="400" required />
            <button type="button" onclick={tap}>Tap</button>
          </span>
        </label>
        <label class="field">
          <span>Beats per bar</span>
          <select bind:value={form.beatsPerBar}>
            {#each BEATS_PER_BAR_OPTIONS as n (n)}<option value={n}>{n}</option>{/each}
          </select>
        </label>
      </div>

      <ChoiceGroup legend="Feel" name="feel" options={feelOptions} bind:value={form.feel} />
      <ChoiceGroup legend="Drums play with" name="implement" options={implementOptions} bind:value={form.drumImplement} />
      <ChoiceGroup legend="Drums" name="entry" options={entryOptions} bind:value={form.drumsEntry} />
      {#if form.drumsEntry === 'later'}
        <label class="field">
          <span>Drums come in at</span>
          <input bind:value={form.drumsEntryNote} maxlength="200" placeholder="e.g. bridge of the first head" />
        </label>
      {/if}

      <fieldset class="plain">
        <legend>Solo order</legend>
        <SoloOrderEditor bind:soloOrder={form.soloOrder} />
      </fieldset>

      <label class="field">
        <span>Notes</span>
        <textarea bind:value={form.notes} rows="4" maxlength="5000"></textarea>
      </label>

      {#if error}<p class="error">{error}</p>{/if}

      <div class="actions">
        <button class="primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        <a class="button" href={id ? `#/arrangements/${id}` : '#/'}>Cancel</a>
        {#if id}<button type="button" class="danger" onclick={remove}>Delete</button>{/if}
      </div>
    </form>
  {/if}
</section>
