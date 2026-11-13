<script>
  import Icon from './Icon.svelte'
  import { applyTheme, readTheme } from '../lib/theme.js'
  import { initials, session } from '../lib/session.svelte.js'
  import { nextTheme } from '../../shared/theme.js'

  let { sidebarOpen, ontogglesidebar } = $props()

  let menuOpen = $state(false)
  let theme = $state(readTheme())
  const THEME_UI = {
    system: { icon: 'auto', label: 'Theme: match system' },
    dark: { icon: 'moon', label: 'Theme: dark' },
    light: { icon: 'sun', label: 'Theme: light' },
  }

  function cycleTheme() {
    theme = nextTheme(theme)
    applyTheme(theme)
  }
</script>

<svelte:window onkeydown={(e) => menuOpen && e.key === 'Escape' && (menuOpen = false)} />

<header class="topbar">
  <button
    class="icon-button hamburger"
    onclick={ontogglesidebar}
    aria-label="Menu"
    aria-controls="sidebar"
    aria-expanded={sidebarOpen}
  >
    <Icon name="menu" size={22} />
  </button>
  <a class="topbar-brand" href="#/">Jazz Setlist</a>

  <div class="topbar-actions">
    <button class="icon-button" onclick={cycleTheme} aria-label={THEME_UI[theme].label} title={THEME_UI[theme].label}>
      <Icon name={THEME_UI[theme].icon} size={20} />
    </button>
    <div class="user-menu">
      <button
        class="avatar"
        onclick={() => (menuOpen = !menuOpen)}
        aria-label="Account menu"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        title={session.user?.email}
      >
        {initials(session.user?.email)}
      </button>
      {#if menuOpen}
        <div class="menu-dismiss" onclick={() => (menuOpen = false)} aria-hidden="true"></div>
        <div class="menu" role="menu">
          <p class="menu-email">{session.user?.email}</p>
          <a role="menuitem" href="#/preferences" onclick={() => (menuOpen = false)}>
            <Icon name="preferences" size={18} /> Preferences
          </a>
          <a role="menuitem" href="/cdn-cgi/access/logout">
            <Icon name="logout" size={18} /> Log out
          </a>
        </div>
      {/if}
    </div>
  </div>
</header>
