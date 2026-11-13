export const FEELS = ['swing', 'straight', 'bossa', 'latin']
export const DRUM_IMPLEMENTS = ['sticks', 'brushes']
export const DRUMS_ENTRIES = ['top', 'later']
export const SOLO_TYPES = ['solo', 'trade', 'over_head']
export const TRADE_BARS = [2, 4, 8]
export const BEATS_PER_BAR_OPTIONS = [2, 3, 4, 5, 6, 7, 9, 12]
export const BEAT_UNITS = [2, 4, 8]
/** Common time signatures, offered as the default in preferences. */
export const TIME_SIGNATURES = ['2/4', '3/4', '4/4', '5/4', '6/4', '6/8', '7/4', '9/8', '12/8']

export const timeSignature = (arrangement) => `${arrangement.beatsPerBar}/${arrangement.beatUnit ?? 4}`

/** "6/8" -> { beatsPerBar: 6, beatUnit: 8 } */
export function parseTimeSignature(sig) {
  const [beatsPerBar, beatUnit] = sig.split('/').map(Number)
  return { beatsPerBar, beatUnit }
}
export const INSTRUMENTS = [
  'piano',
  'guitar',
  'sax',
  'trumpet',
  'trombone',
  'vibes',
  'vocals',
  'bass',
  'drums',
]

/** Other names people type for the instruments in INSTRUMENTS. */
const INSTRUMENT_ALIASES = {
  saxophone: 'sax',
  tenor: 'sax',
  alto: 'sax',
  'tenor sax': 'sax',
  'alto sax': 'sax',
  keys: 'piano',
  keyboard: 'piano',
  vocal: 'vocals',
  voice: 'vocals',
  vibraphone: 'vibes',
  drum: 'drums',
  'upright bass': 'bass',
  'double bass': 'bass',
}

/** The Icon.svelte name for an instrument, or null when it has no icon of its own (free text). */
export function instrumentIcon(instrument) {
  const name = (instrument ?? '').trim().toLowerCase()
  const known = INSTRUMENTS.includes(name) ? name : INSTRUMENT_ALIASES[name]
  if (!known) return null
  return known === 'drums' ? 'drum' : known
}

/** Icons for a solo-order chip: the soloist's instrument (the mic when it has no icon), plus the loop for
    over the head out. A trade keeps its arrows; its instruments are in the text. */
export function soloEntryIcons(entry) {
  if (entry.type === 'trade') return ['trade']
  const icon = instrumentIcon(entry.instrument) ?? 'solo'
  return entry.type === 'over_head' ? [icon, 'over_head'] : [icon]
}

export const LABELS = {
  feel: { swing: 'Swing', straight: 'Straight', bossa: 'Bossa', latin: 'Latin' },
  drumImplement: { sticks: 'Sticks', brushes: 'Brushes' },
  drumsEntry: { top: 'Drums from the top', later: 'Drums come in later' },
  soloType: { solo: 'Solo', trade: 'Trade', over_head: 'Over the head out' },
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export function describeSoloEntry(entry) {
  switch (entry.type) {
    case 'solo':
      return capitalize(entry.instrument)
    case 'trade':
      return `${entry.instruments.map(capitalize).join(' ⇄ ')} trade ${entry.bars}s`
    case 'over_head':
      return `${capitalize(entry.instrument)} over the head out`
    default:
      return ''
  }
}

export function soloEntryHasDrums(entry) {
  return entry.type === 'trade' ? entry.instruments.includes('drums') : entry.instrument === 'drums'
}
