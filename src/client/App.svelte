<script>
  import ArrangementEditPage from './pages/ArrangementEditPage.svelte'
  import ArrangementsPage from './pages/ArrangementsPage.svelte'
  import PreferencesPage from './pages/PreferencesPage.svelte'
  import SetlistPage from './pages/SetlistPage.svelte'
  import SetlistsPage from './pages/SetlistsPage.svelte'
  import InstallPrompt from './components/InstallPrompt.svelte'
  import Sidebar from './components/Sidebar.svelte'
  import Topbar from './components/Topbar.svelte'
  import { api, saveActiveSetlistsOffline } from './lib/api.js'
  import { connection } from './lib/connection.svelte.js'
  import { rememberRoute, startRoute } from './lib/last-route.js'
  import { matchRoute } from './lib/router.js'
  import { loadSession } from './lib/session.svelte.js'

  // Opened without a route (the installed app's start URL): go back to the page you were on.
  const start = startRoute(location.hash)
  if (start) history.replaceState(null, '', start)
  rememberRoute(location.hash)

  let hash = $state(location.hash)
  const route = $derived(matchRoute(hash))
  let sidebarOpen = $state(false)

  // Pages read the user's preferences (defaults for new tunes, hidden badges), so load them first.
  const sessionReady = loadSession()
  // Then keep the active setlists on this device, so they work offline. A failure just leaves the older copy.
  sessionReady.then(saveActiveSetlistsOffline).catch(() => {})

  function hashChanged() {
    hash = location.hash
    rememberRoute(hash)
  }
</script>

<!-- Back online: one request clears the offline banner (pages showing the saved copy then reload). -->
<svelte:window onhashchange={hashChanged} ononline={() => api.me().catch(() => {})} />

<Sidebar open={sidebarOpen} current={route.name} onclose={() => (sidebarOpen = false)} />

<div class="shell">
  <Topbar {sidebarOpen} ontogglesidebar={() => (sidebarOpen = !sidebarOpen)} />

  <main>
    {#if connection.offline}
      <p class="offline" role="status">
        <strong>Offline:</strong> showing the saved copy; changes can’t be saved.
        <span class="muted">Online? Reload to sign in again.</span>
      </p>
    {/if}
    {#await sessionReady}
      <p class="muted">Loading…</p>
    {:then}
      {#key `${route.name}:${route.name === 'arrangements' ? '' : (route.id ?? '')}`}
        {#if route.name === 'arrangements'}
          <ArrangementsPage selectedId={route.id} />
        {:else if route.name === 'arrangement-edit'}
          <ArrangementEditPage id={route.id} />
        {:else if route.name === 'setlists'}
          <SetlistsPage archived={route.archived} />
        {:else if route.name === 'setlist'}
          <SetlistPage id={route.id} />
        {:else if route.name === 'preferences'}
          <PreferencesPage />
        {:else}
          <p class="muted">Page not found. <a href="#/">Back to tunes</a></p>
        {/if}
      {/key}
    {:catch err}
      <p class="error">{err.message}</p>
    {/await}
  </main>
</div>

<InstallPrompt />

<style>
  .offline {
    margin: 0 0 0.75rem;
    padding: 0.4rem 0.75rem;
    font-size: 0.9rem;
    border: 1px solid var(--accent);
    border-radius: var(--radius);
    background: var(--bg-raised);
    color: var(--text);
  }
</style>
