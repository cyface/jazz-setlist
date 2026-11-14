<script>
  import Icon from './Icon.svelte'
  import { forgetRoute } from '../lib/last-route.js'
  import { clearCopy } from '../lib/offline.js'
  import { forgetPositions } from '../lib/setlist-position.js'
  import { initials, session } from '../lib/session.svelte.js'

  let { sidebarOpen, ontogglesidebar } = $props()

  let menuOpen = $state(false)

  /** The next person on this browser shouldn't see this user's saved setlists or land on their last page. */
  function forgetDevice() {
    clearCopy()
    forgetRoute()
    forgetPositions()
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
          <a role="menuitem" href="/cdn-cgi/access/logout" onclick={forgetDevice}>
            <Icon name="logout" size={18} /> Log out
          </a>
        </div>
      {/if}
    </div>
  </div>
</header>
