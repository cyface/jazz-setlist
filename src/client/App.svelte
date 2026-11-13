<script>
  import ArrangementEditPage from './pages/ArrangementEditPage.svelte'
  import ArrangementsPage from './pages/ArrangementsPage.svelte'
  import SetlistPage from './pages/SetlistPage.svelte'
  import SetlistsPage from './pages/SetlistsPage.svelte'
  import Icon from './components/Icon.svelte'
  import InstallPrompt from './components/InstallPrompt.svelte'
  import { matchRoute } from './lib/router.js'
  import { applyTheme, readTheme } from './lib/theme.js'
  import { nextTheme } from '../shared/theme.js'

  let hash = $state(location.hash)
  const route = $derived(matchRoute(hash))

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

<svelte:window onhashchange={() => (hash = location.hash)} />

<header class="topbar">
  <a class="brand" href="#/">Jazz Setlist</a>
  <nav>
    <a href="#/" class:current={route.name === 'arrangements' || route.name === 'arrangement-edit'}>Tunes</a>
    <a href="#/setlists" class:current={route.name === 'setlists' || route.name === 'setlist'}>Setlists</a>
  </nav>
  <button class="icon-button theme-toggle" onclick={cycleTheme} aria-label={THEME_UI[theme].label} title={THEME_UI[theme].label}>
    <Icon name={THEME_UI[theme].icon} size={20} />
  </button>
</header>

<main>
  {#key `${route.name}:${route.name === 'arrangements' ? '' : (route.id ?? '')}`}
    {#if route.name === 'arrangements'}
      <ArrangementsPage selectedId={route.id} />
    {:else if route.name === 'arrangement-edit'}
      <ArrangementEditPage id={route.id} />
    {:else if route.name === 'setlists'}
      <SetlistsPage />
    {:else if route.name === 'setlist'}
      <SetlistPage id={route.id} />
    {:else}
      <p class="muted">Page not found. <a href="#/">Back to tunes</a></p>
    {/if}
  {/key}
</main>

<InstallPrompt />
