import 'vitest-browser-svelte'
import '../app.css'
import { afterEach, beforeEach } from 'vitest'
import { connection } from '../lib/connection.svelte.js'

// Each test starts online, on no route, with nothing remembered and the system theme.
beforeEach(() => {
  connection.offline = false
  localStorage.clear()
  delete document.documentElement.dataset.theme
  history.replaceState(null, '', '#')
})
afterEach(() => {
  connection.offline = false
})
