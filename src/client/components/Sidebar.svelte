<script>
  import Icon from './Icon.svelte'

  /** Layout from cyface-invoice: a slide-in drawer on phones (opened by the top bar's hamburger),
      an icon rail on tablets and a full sidebar on desktops. */
  let { open, current, onclose } = $props()

  const ITEMS = [
    { href: '#/', label: 'Tunes', icon: 'tunes', match: ['arrangements', 'arrangement-edit'] },
    { href: '#/setlists', label: 'Setlists', icon: 'setlists', match: ['setlists', 'setlist'] },
    { href: '#/preferences', label: 'Preferences', icon: 'preferences', match: ['preferences'] },
  ]

  // Keep the page behind the open drawer from scrolling.
  $effect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => (document.body.style.overflow = '')
  })
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && onclose()} />

<div class="sidebar-backdrop" class:open onclick={onclose} aria-hidden="true"></div>

<aside id="sidebar" class="sidebar" class:open aria-label="Main menu">
  <div class="sidebar-head">
    <a class="brand" href="#/" onclick={onclose}>
      <Icon name="tunes" size={22} />
      <span class="label">Jazz Setlist</span>
    </a>
    <button class="icon-button sidebar-close" onclick={onclose} aria-label="Close menu">
      <Icon name="close" size={20} />
    </button>
  </div>

  <nav class="sidebar-nav">
    {#each ITEMS as item (item.href)}
      <a
        href={item.href}
        class:current={item.match.includes(current)}
        aria-current={item.match.includes(current) ? 'page' : undefined}
        title={item.label}
        onclick={onclose}
      >
        <Icon name={item.icon} size={20} />
        <span class="label">{item.label}</span>
      </a>
    {/each}
  </nav>

  <p class="version">v{__APP_VERSION__}</p>
</aside>
