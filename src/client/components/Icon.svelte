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
  {:else if name === 'bossa'}
    <!-- a shaken maraca -->
    <ellipse cx="13.6" cy="8.6" rx="4.4" ry="5.4" transform="rotate(35 13.6 8.6)" fill="currentColor" />
    <path d="M10.5 13 5.6 19.9" stroke-width="2.6" />
    <path d="M4.6 9.4c.2-1.5.9-2.8 2-3.8M2.4 8.6c.3-2.3 1.4-4.3 3.1-5.8M18.4 15.4c1.2-.4 2.2-1.1 2.9-2.1M18.6 18.4c1.7-.6 3-1.6 3.9-3" stroke-width="1.4" />
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
  {:else if name === 'piano'}
    <!-- instruments: instrumentIcon() in attributes.js picks these; drums use 'drum' -->
    <rect x="3" y="5" width="18" height="14" rx="1.5" />
    <path d="M7.5 13v6M12 13v6M16.5 5v14" />
    <path d="M6.4 5.5h2.2V13H6.4zM10.9 5.5h2.2V13h-2.2z" fill="currentColor" stroke-width="1" />
  {:else if name === 'guitar'}
    <g transform="rotate(40 12 12)">
      <path d="M10.7 9.5C8.4 9.5 7.6 11.4 8.6 13 6.3 13.8 5.6 16.3 6.5 18.3 7.4 20.4 9.8 21.3 12 21.3s4.6-.9 5.5-3c.9-2-.2-4.5-2.1-5.3 1-1.6.2-3.5-2.1-3.5" />
      <path d="M11 9.5V2.5h2v7" />
      <circle cx="12" cy="15.8" r="1.6" />
      <path d="M10.4 19h3.2" />
    </g>
  {:else if name === 'sax'}
    <path d="M5 3.2c2.5-.6 4.4.1 4.6 2.3" />
    <path d="M9.4 5.5V15.6c0 3.4 2 5.4 4.6 5.4 2.7 0 4.6-1.9 4.6-4.6V12.8" />
    <path d="M11.9 5.5v10c0 1.8.9 2.9 2.2 2.9s2-.9 2-2.4V12.8" />
    <path d="M15 12.8h5" />
    <circle cx="10.65" cy="8.5" r="0.7" fill="currentColor" stroke="none" />
    <circle cx="10.65" cy="11" r="0.7" fill="currentColor" stroke="none" />
    <circle cx="10.65" cy="13.5" r="0.7" fill="currentColor" stroke="none" />
  {:else if name === 'trumpet'}
    <path d="M2.5 10v3M2.5 11.5H14" />
    <path d="M14 10.6c3 0 5.2-1.3 7-3.4v8.6c-1.8-2.1-4-3.4-7-3.4z" />
    <path d="M5.5 11.5V15a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5v-2.6" />
    <path d="M7.5 11.5V7.5M10 11.5V7.5M12.5 11.5V7.5M6.6 6.8h1.8M9.1 6.8h1.8M11.6 6.8h1.8" />
  {:else if name === 'trombone'}
    <path d="M12.5 7.3c3.2 0 5.8-1.3 8.5-3.3v7.6c-2.7-2-5.3-3.3-8.5-3.3" />
    <path d="M12.5 7.3H5.5c-2.6 0-2.6 6.2 0 6.2h14.2a1.75 1.75 0 0 1 0 3.5H5.5M3 17h2.5" />
    <path d="M9 8.3v5.2" />
  {:else if name === 'vibes'}
    <path d="M3 9.5h2.4v11H3zM7.8 10.5h2.4v9H7.8zM12.6 11.5H15v7h-2.4zM17.4 12.5h2.4v5h-2.4z" />
    <path d="M20.5 8.5 14.6 3.5" />
    <circle cx="13.4" cy="2.9" r="1.4" fill="currentColor" stroke="none" />
  {:else if name === 'vocals'}
    <path d="M4 21v-3.4C2.8 16.3 2 14.5 2 12.5 2 8.4 5.1 5 9.3 5c3.6 0 6.2 2.6 6.2 5.7l1.5 2.8-1.5.6v1.6c0 1-.8 1.8-1.8 1.8H12V21" />
    <path d="M18.5 9a4.2 4.2 0 0 1 0 5.5M20.7 6.8a7.3 7.3 0 0 1 0 9.9" />
  {:else if name === 'bass'}
    <circle cx="12" cy="2.5" r="1.2" />
    <path d="M10.6 8.6C8 8.6 7.6 10.6 8.6 12c.6.8.6 1.4-.4 2-1.8 1-2.2 3-1.4 4.6 1 2 3.2 2.4 5.2 2.4s4.2-.4 5.2-2.4c.8-1.6.4-3.6-1.4-4.6-1-.6-1-1.2-.4-2 1-1.4.6-3.4-2-3.4" />
    <path d="M12 3.7V18.5M10.2 16.2h3.6M12 21v1.8" />
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
