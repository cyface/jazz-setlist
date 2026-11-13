export const FEELS = ['swing', 'straight']
export const DRUM_IMPLEMENTS = ['sticks', 'brushes']
export const DRUMS_ENTRIES = ['top', 'later']
export const SOLO_TYPES = ['solo', 'trade', 'over_head']
export const TRADE_BARS = [2, 4, 8]
export const BEATS_PER_BAR_OPTIONS = [2, 3, 4, 5, 6, 7]
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

export const LABELS = {
  feel: { swing: 'Swing', straight: 'Straight' },
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
