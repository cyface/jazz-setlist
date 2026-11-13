<script>
  import Icon from './Icon.svelte'

  /** options: [{ value, label, icon }] — a radio group rendered as icon buttons. */
  let { legend, name, options, value = $bindable() } = $props()
</script>

<fieldset class="choice-group">
  <legend>{legend}</legend>
  <div class="options">
    {#each options as option (option.value)}
      <label class:selected={value === option.value}>
        <input type="radio" {name} value={option.value} bind:group={value} />
        <Icon name={option.icon} size={26} />
        <span>{option.label}</span>
      </label>
    {/each}
  </div>
</fieldset>

<style>
  .choice-group {
    border: none;
    margin: 0;
    padding: 0;
  }
  legend {
    padding: 0;
    margin-bottom: 0.4rem;
    font-weight: 600;
  }
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.9rem;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--bg-raised);
    cursor: pointer;
  }
  label.selected {
    border-color: var(--accent);
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, var(--bg-raised));
  }
  label:has(:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
</style>
