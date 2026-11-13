// Web Audio lookahead scheduler: a timer schedules clicks slightly ahead on the
// audio clock (sample-accurate); requestAnimationFrame lights each beat square
// when the audio clock reaches that click's time.
import { holdReload as defaultHoldReload } from './reload-guard.js'

export const LOOKAHEAD_MS = 25
export const SCHEDULE_AHEAD_S = 0.1
export const ACCENTS = ['one', 'two-four']

export function isAccent(beat, beatsPerBar, accent) {
  if (accent === 'two-four' && beatsPerBar % 2 === 0) return beat % 2 === 1
  return beat === 0
}

export function planBeats({ nextTime, beat, until, bpm, beatsPerBar }) {
  const step = 60 / bpm
  const events = []
  let b = beat % beatsPerBar
  let time = nextTime
  while (time < until) {
    events.push({ beat: b, time })
    time += step
    b = (b + 1) % beatsPerBar
  }
  return { events, nextTime: time, beat: b }
}

export function createMetronome({
  getSettings,
  onBeat,
  createContext = () => new AudioContext(),
  // A new release must not reload the page mid-tune: hold it until the metronome stops.
  holdReload = defaultHoldReload,
}) {
  let ctx
  let releaseReload
  let timer
  let frame
  let nextTime = 0
  let beat = 0
  let queue = []

  function click(time, accent) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = accent ? 1760 : 1100
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(accent ? 1 : 0.55, time + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)
    osc.connect(gain).connect(ctx.destination)
    osc.start(time)
    osc.stop(time + 0.06)
  }

  function schedule() {
    const { bpm, beatsPerBar, accent, sound = true } = getSettings()
    const plan = planBeats({ nextTime, beat, until: ctx.currentTime + SCHEDULE_AHEAD_S, bpm, beatsPerBar })
    for (const e of plan.events) {
      // Muted: same timing and beat lights, just no click.
      if (sound) click(e.time, isAccent(e.beat, beatsPerBar, accent))
      queue.push(e)
    }
    nextTime = plan.nextTime
    beat = plan.beat
  }

  function draw() {
    let current
    while (queue.length && queue[0].time <= ctx.currentTime) current = queue.shift()
    if (current) onBeat(current.beat)
    frame = requestAnimationFrame(draw)
  }

  return {
    async start() {
      ctx ??= createContext()
      await ctx.resume()
      beat = 0
      queue = []
      nextTime = ctx.currentTime + 0.05
      schedule()
      timer = setInterval(schedule, LOOKAHEAD_MS)
      frame = requestAnimationFrame(draw)
      releaseReload ??= holdReload()
    },
    stop() {
      clearInterval(timer)
      cancelAnimationFrame(frame)
      queue = []
      onBeat(-1)
      releaseReload?.()
      releaseReload = undefined
    },
    destroy() {
      this.stop()
      ctx?.close()
      ctx = undefined
    },
  }
}

const TAP_RESET_MS = 2000

/** Tap tempo: returns the BPM from the average of recent tap intervals, or null. */
export function tapTempo(taps, now) {
  const recent = [...taps.filter((t) => now - t < TAP_RESET_MS), now].slice(-6)
  if (recent.length < 2) return { taps: recent, bpm: null }
  const avg = (recent.at(-1) - recent[0]) / (recent.length - 1)
  return { taps: recent, bpm: Math.round(60000 / avg) }
}
