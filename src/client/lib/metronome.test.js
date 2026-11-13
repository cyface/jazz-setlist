import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMetronome, isAccent, planBeats, tapTempo } from './metronome.js'

describe('planBeats', () => {
  it('schedules every beat before the horizon at the tempo spacing', () => {
    const plan = planBeats({ nextTime: 0, beat: 0, until: 1.6, bpm: 120, beatsPerBar: 3 })
    expect(plan.events).toEqual([
      { beat: 0, time: 0 },
      { beat: 1, time: 0.5 },
      { beat: 2, time: 1 },
      { beat: 0, time: 1.5 },
    ])
    expect(plan.nextTime).toBe(2)
    expect(plan.beat).toBe(1)
  })

  it('schedules nothing when the next beat is past the horizon', () => {
    const plan = planBeats({ nextTime: 5, beat: 2, until: 4, bpm: 200, beatsPerBar: 4 })
    expect(plan).toEqual({ events: [], nextTime: 5, beat: 2 })
  })

  it('wraps the beat when the bar shortens mid-play', () => {
    const plan = planBeats({ nextTime: 0, beat: 3, until: 0.1, bpm: 60, beatsPerBar: 3 })
    expect(plan.events[0].beat).toBe(0)
  })
})

describe('isAccent', () => {
  it('accents beat one by default', () => {
    expect([0, 1, 2, 3].map((b) => isAccent(b, 4, 'one'))).toEqual([true, false, false, false])
  })

  it('accents 2 and 4 in even meters', () => {
    expect([0, 1, 2, 3].map((b) => isAccent(b, 4, 'two-four'))).toEqual([false, true, false, true])
  })

  it('falls back to beat one for 2 and 4 in odd meters', () => {
    expect([0, 1, 2].map((b) => isAccent(b, 3, 'two-four'))).toEqual([true, false, false])
  })
})

describe('tapTempo', () => {
  it('averages tap intervals', () => {
    let state = { taps: [] }
    for (const t of [0, 500, 1000, 1500]) state = tapTempo(state.taps, t)
    expect(state.bpm).toBe(120)
  })

  it('starts over after a pause', () => {
    const { taps, bpm } = tapTempo([0, 500], 5000)
    expect(taps).toEqual([5000])
    expect(bpm).toBeNull()
  })
})

describe('createMetronome sound', () => {
  afterEach(() => vi.unstubAllGlobals())

  /** A fake AudioContext whose clock the test moves, counting the oscillators it makes. */
  function fakeContext() {
    const node = () => ({
      connect: (next) => next,
      frequency: {},
      gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      start() {},
      stop() {},
    })
    const ctx = { currentTime: 0, destination: {}, oscillators: 0, resume: async () => {}, close() {}, createGain: node }
    ctx.createOscillator = () => (ctx.oscillators++, node())
    return ctx
  }

  async function play(sound) {
    let frame
    vi.stubGlobal('requestAnimationFrame', (fn) => ((frame = fn), 1))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const ctx = fakeContext()
    const beats = []
    const metronome = createMetronome({
      getSettings: () => ({ bpm: 120, beatsPerBar: 4, accent: 'one', sound }),
      onBeat: (b) => beats.push(b),
      createContext: () => ctx,
      holdReload: () => () => {},
    })
    await metronome.start()
    ctx.currentTime = 0.06 // past the first click
    frame()
    metronome.destroy()
    return { oscillators: ctx.oscillators, beats }
  }

  it('clicks when sound is on', async () => {
    const { oscillators, beats } = await play(true)
    expect(oscillators).toBeGreaterThan(0)
    expect(beats).toEqual([0, -1])
  })

  it('makes no audio nodes when sound is off, but still lights the beats', async () => {
    const { oscillators, beats } = await play(false)
    expect(oscillators).toBe(0)
    expect(beats).toEqual([0, -1])
  })
})
