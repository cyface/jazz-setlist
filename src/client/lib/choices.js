import { LABELS } from '../../shared/attributes.js'

/** Options for the ChoiceGroup radio buttons, shared by the tune form and preferences. */
export const FEEL_OPTIONS = [
  { value: 'swing', label: LABELS.feel.swing, icon: 'swing' },
  { value: 'straight', label: LABELS.feel.straight, icon: 'straight' },
  { value: 'bossa', label: LABELS.feel.bossa, icon: 'bossa' },
  { value: 'latin', label: LABELS.feel.latin, icon: 'latin' },
]
export const IMPLEMENT_OPTIONS = [
  { value: 'sticks', label: LABELS.drumImplement.sticks, icon: 'sticks' },
  { value: 'brushes', label: LABELS.drumImplement.brushes, icon: 'brushes' },
]
export const ENTRY_OPTIONS = [
  { value: 'top', label: 'From the top', icon: 'drum' },
  { value: 'later', label: 'Come in later', icon: 'drum-later' },
]
