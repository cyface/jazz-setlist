<script>
  /** Hand-drawn 24×24 icons. `title` becomes the accessible name; without it the icon is decorative. */
  let { name, title = undefined, size = 22 } = $props()
</script>

<svg
  class="icon"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
  role={title ? 'img' : undefined}
  aria-label={title}
  aria-hidden={title ? undefined : 'true'}
>
  {#if title}<title>{title}</title>{/if}
  {#if name === 'swing'}
    <!-- dotted eighth + sixteenth -->
    <ellipse cx="6.4" cy="18.2" rx="2.6" ry="1.9" transform="rotate(-20 6.4 18.2)" fill="currentColor" stroke="none" />
    <ellipse cx="16.4" cy="16.2" rx="2.6" ry="1.9" transform="rotate(-20 16.4 16.2)" fill="currentColor" stroke="none" />
    <path d="M8.7 17.6V5M18.7 15.6V4" />
    <path d="M8.7 5.2 18.7 4.2" stroke-width="2.6" stroke-linecap="butt" />
    <path d="M15.6 7.6 18.7 7.3" stroke-width="2.6" stroke-linecap="butt" />
    <circle cx="11" cy="19" r="1" fill="currentColor" stroke="none" />
  {:else if name === 'straight'}
    <!-- two even eighths -->
    <ellipse cx="6.4" cy="18.2" rx="2.6" ry="1.9" transform="rotate(-20 6.4 18.2)" fill="currentColor" stroke="none" />
    <ellipse cx="16.4" cy="18.2" rx="2.6" ry="1.9" transform="rotate(-20 16.4 18.2)" fill="currentColor" stroke="none" />
    <path d="M8.7 17.6V5M18.7 17.6V5" />
    <path d="M8.7 5.2H18.7" stroke-width="2.6" stroke-linecap="butt" />
  {:else if name === 'sticks'}
    <path d="M4 21 17 5M20 21 7 5" stroke-width="2.2" />
    <circle cx="17.7" cy="4.2" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="6.3" cy="4.2" r="1.5" fill="currentColor" stroke="none" />
  {:else if name === 'brushes'}
    <path d="M5 21 11 12.5" stroke-width="2.6" />
    <path d="M11 12.5 7.5 3.5M11 12.5 10.5 2.8M11 12.5 13.8 3M11 12.5 16.6 4.4M11 12.5 19 6.6M11 12.5 20.4 9.4" stroke-width="1" />
  {:else if name === 'drum'}
    <ellipse cx="12" cy="8" rx="8" ry="3" />
    <path d="M4 8v8c0 1.7 3.6 3 8 3s8-1.3 8-3V8M7 10.6l2.5 7.8M17 10.6l-2.5 7.8" />
  {:else if name === 'drum-later'}
    <g stroke-dasharray="2 2.4">
      <ellipse cx="12" cy="8" rx="8" ry="3" />
      <path d="M4 8v8c0 1.7 3.6 3 8 3s8-1.3 8-3V8" />
    </g>
    <circle cx="18.5" cy="17.5" r="4.2" fill="var(--bg-raised)" />
    <path d="M18.5 15.4v2.3l1.5 1" stroke-width="1.5" />
  {:else if name === 'solo'}
    <path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" />
    <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" />
  {:else if name === 'trade'}
    <path d="M4 8h15M16 5l3 3-3 3M20 16H5M8 13l-3 3 3 3" />
  {:else if name === 'over_head'}
    <path d="M20 12a8 8 0 1 1-2.3-5.6" />
    <path d="M20 4v4h-4" />
    <path d="M10 15.5V9.5l5 3z" fill="currentColor" stroke="none" />
  {:else if name === 'break'}
    <path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
    <path d="M16 11h1.5a2 2 0 0 1 0 4H16M8 3.5v2.5M11 3v3M14 3.5v2.5" />
  {:else if name === 'play'}
    <path d="M7 4.5v15l13-7.5z" fill="currentColor" />
  {:else if name === 'stop'}
    <rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" />
  {:else if name === 'up'}
    <path d="m6 15 6-6 6 6" />
  {:else if name === 'down'}
    <path d="m6 9 6 6 6-6" />
  {:else if name === 'left'}
    <path d="m15 6-6 6 6 6" />
  {:else if name === 'right'}
    <path d="m9 6 6 6-6 6" />
  {:else if name === 'plus'}
    <path d="M12 5v14M5 12h14" />
  {:else if name === 'download'}
    <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
  {:else if name === 'close'}
    <path d="M6 6l12 12M18 6 6 18" />
  {:else if name === 'menu'}
    <path d="M4 7h16M4 12h16M4 17h16" />
  {:else if name === 'tunes'}
    <!-- a single eighth note -->
    <ellipse cx="8.5" cy="17.5" rx="3.2" ry="2.4" transform="rotate(-20 8.5 17.5)" fill="currentColor" stroke="none" />
    <path d="M11.4 16.6V4c1.5 2.6 5.6 3.4 5.6 7.4" />
  {:else if name === 'setlists'}
    <path d="M9 6.5h11M9 12h11M9 17.5h11" />
    <path d="M4 5.5 5.2 7.5 7 5M4 11l1.2 2L7 10.5" />
    <circle cx="5.3" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
  {:else if name === 'preferences'}
    <!-- sliders -->
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  {:else if name === 'logout'}
    <path d="M10 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H10M14 8l4 4-4 4M18 12H9.5" />
  {:else if name === 'sun'}
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  {:else if name === 'moon'}
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  {:else if name === 'auto'}
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none" />
  {:else if name === 'archive'}
    <rect x="3.5" y="4.5" width="17" height="4" rx="1" />
    <path d="M5 8.5V18a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V8.5M10 12.5h4" />
  {:else if name === 'unarchive'}
    <rect x="3.5" y="4.5" width="17" height="4" rx="1" />
    <path d="M5 8.5V18a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V8.5M12 17v-5.5M9.5 14 12 11.5l2.5 2.5" />
  {:else if name === 'edit'}
    <path d="M4 20h4L19 9l-4-4L4 16z" />
  {/if}
</svg>

<style>
  .icon {
    flex: none;
    display: inline-block;
    vertical-align: middle;
  }
</style>
