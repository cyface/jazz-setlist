import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addMenu, addedMessage } from './add-to-setlist.js'
import { LONG_PRESS_MS, longpress } from './longpress.js'

describe('addMenu', () => {
  const winter = { id: 'w', name: 'Winter', archivedAt: null, hasTune: false }
  const spring = { id: 's', name: 'Spring', archivedAt: null, hasTune: false }
  const old = { id: 'o', name: 'Old', archivedAt: '2026-01-01T00:00:00Z', hasTune: false }

  it('offers only the active setlists, in order', () => {
    expect(addMenu([winter, old, spring])).toEqual({ already: null, choices: [winter, spring] })
    expect(addMenu([old])).toEqual({ already: null, choices: [] })
  })

  it('says the tune is already there when the only active setlist has it', () => {
    const has = { ...winter, hasTune: true }
    expect(addMenu([has, { ...old, hasTune: true }])).toEqual({ already: has, choices: [] })
  })

  it('still offers every active setlist when there are several, even one that has it', () => {
    const has = { ...winter, hasTune: true }
    expect(addMenu([has, spring])).toEqual({ already: null, choices: [has, spring] })
  })
})

describe('addedMessage', () => {
  const tune = { id: 'a', title: 'Afro Blue' }
  const setlist = (...ids) => ({ name: 'Winter', items: ids.map((id) => (id ? { arrangement: { id } } : { arrangement: null })) })

  it('confirms the add', () => {
    expect(addedMessage(tune, setlist('b', null, 'a'))).toBe('Added “Afro Blue” to Winter.')
  })

  it('notes a tune that was already there', () => {
    expect(addedMessage(tune, setlist('a', 'a'))).toBe('Added “Afro Blue” to Winter. It’s in there twice now.')
    expect(addedMessage(tune, setlist('a', 'a', 'a', 'a'))).toMatch(/4 times now\.$/)
  })
})

describe('longpress', () => {
  let node, onLongPress, action
  const fire = (type, props = {}) => {
    const e = Object.assign(new Event(type, { cancelable: true }), { button: 0, pointerType: 'touch', clientX: 0, clientY: 0, ...props })
    node.dispatchEvent(e)
    return e
  }

  beforeEach(() => {
    vi.useFakeTimers()
    node = new EventTarget()
    onLongPress = vi.fn()
    action = longpress(node, onLongPress)
  })
  afterEach(() => {
    action.destroy()
    vi.useRealTimers()
  })

  it('fires after a held press and swallows the click that ends it', () => {
    fire('pointerdown')
    vi.advanceTimersByTime(LONG_PRESS_MS)
    expect(onLongPress).toHaveBeenCalledOnce()
    fire('pointerup')
    expect(fire('click').defaultPrevented).toBe(true)
    // The next ordinary tap navigates as usual.
    fire('pointerdown')
    fire('pointerup')
    expect(fire('click').defaultPrevented).toBe(false)
  })

  it('treats a held mouse button as a click (desktop uses right-click)', () => {
    fire('pointerdown', { pointerType: 'mouse' })
    vi.advanceTimersByTime(LONG_PRESS_MS * 2)
    expect(onLongPress).not.toHaveBeenCalled()
    expect(fire('click').defaultPrevented).toBe(false)
  })

  it('ignores a quick tap', () => {
    fire('pointerdown')
    vi.advanceTimersByTime(LONG_PRESS_MS - 100)
    fire('pointerup')
    vi.advanceTimersByTime(1000)
    expect(onLongPress).not.toHaveBeenCalled()
    expect(fire('click').defaultPrevented).toBe(false)
  })

  it('ignores a press that turns into a scroll', () => {
    fire('pointerdown', { clientY: 100 })
    fire('pointermove', { clientY: 104 })
    fire('pointermove', { clientY: 130 })
    vi.advanceTimersByTime(1000)
    expect(onLongPress).not.toHaveBeenCalled()
    fire('pointerdown')
    fire('pointercancel')
    vi.advanceTimersByTime(1000)
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('fires once on a context menu (right-click, Android long press) and blocks the browser menu', () => {
    fire('pointerdown')
    vi.advanceTimersByTime(LONG_PRESS_MS)
    expect(fire('contextmenu').defaultPrevented).toBe(true)
    expect(onLongPress).toHaveBeenCalledOnce()

    fire('pointerdown', { button: 2 })
    vi.advanceTimersByTime(1000)
    fire('contextmenu')
    expect(onLongPress).toHaveBeenCalledTimes(2)
  })

  it('uses the latest callback and stops listening when destroyed', () => {
    const next = vi.fn()
    action.update(next)
    fire('contextmenu')
    expect(next).toHaveBeenCalledOnce()
    action.destroy()
    fire('contextmenu')
    expect(next).toHaveBeenCalledOnce()
  })
})
