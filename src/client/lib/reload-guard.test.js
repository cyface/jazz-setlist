import { afterEach, describe, expect, it, vi } from 'vitest'
import { createReloadGuard } from './reload-guard.js'
import { createMetronome } from './metronome.js'

describe('createReloadGuard', () => {
  it('reloads right away when nothing holds it', () => {
    const reload = vi.fn()
    createReloadGuard(reload).request()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('waits for the last hold to be released, then reloads once', () => {
    const reload = vi.fn()
    const guard = createReloadGuard(reload)
    const first = guard.hold()
    const second = guard.hold()
    guard.request()
    first()
    first()
    expect(reload).not.toHaveBeenCalled()
    second()
    expect(reload).toHaveBeenCalledTimes(1)
    guard.hold()()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('does nothing on release when no reload was requested', () => {
    const reload = vi.fn()
    createReloadGuard(reload).hold()()
    expect(reload).not.toHaveBeenCalled()
  })
})

describe('metronome holds reloads while playing', () => {
  afterEach(() => vi.unstubAllGlobals())

  const fakeContext = () => {
    const node = () => ({
      connect: (next) => next,
      frequency: {},
      gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      start() {},
      stop() {},
    })
    return { currentTime: 0, destination: {}, resume: async () => {}, close() {}, createOscillator: node, createGain: node }
  }

  const setup = () => {
    vi.stubGlobal('requestAnimationFrame', () => 1)
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const reload = vi.fn()
    const guard = createReloadGuard(reload)
    const metronome = createMetronome({
      getSettings: () => ({ bpm: 120, beatsPerBar: 4, accent: 'one' }),
      onBeat() {},
      createContext: fakeContext,
      holdReload: guard.hold,
    })
    return { reload, guard, metronome }
  }

  it('reloads only after the metronome stops', async () => {
    const { reload, guard, metronome } = setup()
    await metronome.start()
    guard.request()
    expect(reload).not.toHaveBeenCalled()
    metronome.stop()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('takes one hold however often it starts, and releases it when destroyed', async () => {
    const { reload, guard, metronome } = setup()
    await metronome.start()
    await metronome.start()
    guard.request()
    metronome.destroy()
    metronome.stop()
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
