/** Setlists that aren't archived, in the API's order (newest show first). */
export const activeSetlists = (setlists) => setlists.filter((s) => !s.archivedAt)

/** A show date ("2026-11-14") as "Sat, Nov 14, 2026"; '' when unset. Noon avoids a timezone shifting the day. */
export const formatShowDate = (d) =>
  d ? new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''

/** "Sat, Nov 14, 2026 · The Blue Room": the parts that are set. */
export const setlistWhenWhere = (s) => [formatShowDate(s.showDate), s.venue].filter(Boolean).join(' · ')

export const tuneCountLabel = (n) => `${n} ${n === 1 ? 'tune' : 'tunes'}`
