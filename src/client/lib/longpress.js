export const LONG_PRESS_MS = 500
/** A press that drifts further than this (px) is a scroll or drag, not a long press. */
export const MOVE_TOLERANCE = 10

/**
 * Svelte action: calls `callback` when the element is held with a finger or pen,
 * or right-clicked with a mouse (the context menu event also covers Android's
 * long press and Shift+F10). A held mouse button is an ordinary click.
 * The click that ends a long press is swallowed, so a held link doesn't navigate.
 */
export function longpress(node, callback) {
  let onLongPress = callback
  let timer = null
  let start = null
  let pressing = false // a touch or pen press is in progress
  let fired = false // swallow the click that ends this press

  const cancel = () => {
    clearTimeout(timer)
    timer = null
  }
  const release = () => {
    cancel()
    pressing = false
  }
  const fire = () => {
    cancel()
    fired = pressing
    globalThis.navigator?.vibrate?.(15)
    onLongPress?.()
  }

  const handlers = {
    pointerdown(e) {
      fired = false
      if (e.button !== 0 || e.pointerType === 'mouse') return
      pressing = true
      start = { x: e.clientX, y: e.clientY }
      cancel()
      timer = setTimeout(fire, LONG_PRESS_MS)
    },
    pointermove(e) {
      if (timer && Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_TOLERANCE) cancel()
    },
    pointerup: release,
    pointercancel: release,
    pointerleave: cancel,
    contextmenu(e) {
      e.preventDefault()
      // A touch hold may already have fired; a mouse right-click or the keyboard menu key fires here.
      if (!fired) fire()
    },
    // A keyboard click (Enter) after a menu was opened is a real click.
    keydown() {
      fired = false
    },
    click(e) {
      if (!fired) return
      fired = false
      e.preventDefault()
      e.stopPropagation()
    },
  }

  for (const [type, handler] of Object.entries(handlers)) node.addEventListener(type, handler)
  return {
    update(next) {
      onLongPress = next
    },
    destroy() {
      cancel()
      for (const [type, handler] of Object.entries(handlers)) node.removeEventListener(type, handler)
    },
  }
}
