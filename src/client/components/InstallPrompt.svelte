<script>
  // Phone-only "install this app" banner (ported from cyface-invoice).
  // Chrome/Android: Install button via beforeinstallprompt. iOS Safari: Share-sheet steps.
  import Icon from './Icon.svelte'
  import { isIOSSafari, rememberInstallDismissed, shouldOfferInstall, wasInstallDismissed } from '../lib/install.js'

  const eligible = shouldOfferInstall()
  const showIOSSteps = eligible && isIOSSafari(navigator.userAgent)
  let deferredPrompt = $state(null)
  let dismissed = $state(wasInstallDismissed())

  $effect(() => {
    if (!eligible) return
    const onBeforeInstall = (e) => {
      e.preventDefault()
      deferredPrompt = e
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  })

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') deferredPrompt = null
  }

  function dismiss() {
    rememberInstallDismissed()
    dismissed = true
    deferredPrompt = null
  }
</script>

{#if !dismissed && (deferredPrompt || showIOSSteps)}
  <aside class="install-prompt" aria-label="Install app">
    <span class="install-icon"><Icon name="download" /></span>
    <div class="install-body">
      <p class="install-title">Install Jazz Setlist</p>
      {#if deferredPrompt}
        <div class="install-actions">
          <button class="primary" onclick={install}>Install</button>
          <button onclick={dismiss}>Not now</button>
        </div>
      {:else}
        <p class="muted">Tap the Share button, then “Add to Home Screen”.</p>
      {/if}
    </div>
    <button class="icon-button install-close" onclick={dismiss} aria-label="Dismiss" title="Dismiss">
      <Icon name="close" size={18} />
    </button>
  </aside>
{/if}
