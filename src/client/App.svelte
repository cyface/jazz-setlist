<script>
  import ArrangementEditPage from './pages/ArrangementEditPage.svelte'
  import ArrangementsPage from './pages/ArrangementsPage.svelte'
  import PreferencesPage from './pages/PreferencesPage.svelte'
  import SetlistPage from './pages/SetlistPage.svelte'
  import SetlistsPage from './pages/SetlistsPage.svelte'
  import InstallPrompt from './components/InstallPrompt.svelte'
  import Sidebar from './components/Sidebar.svelte'
  import Topbar from './components/Topbar.svelte'
  import { matchRoute } from './lib/router.js'
  import { loadSession } from './lib/session.svelte.js'

  let hash = $state(location.hash)
  const route = $derived(matchRoute(hash))
  let sidebarOpen = $state(false)

  // Pages read the user's preferences (defaults for new tunes, hidden badges), so load them first.
  const sessionReady = loadSession()
</script>

<svelte:window onhashchange={() => (hash = location.hash)} />

<Sidebar open={sidebarOpen} current={route.name} onclose={() => (sidebarOpen = false)} />

<div class="shell">
  <Topbar {sidebarOpen} ontogglesidebar={() => (sidebarOpen = !sidebarOpen)} />

  <main>
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
