/** Setlists that aren't archived, in the API's order (newest show first). */
export const activeSetlists = (setlists) => setlists.filter((s) => !s.archivedAt)

/** A show date ("2026-11-14") as "Sat, Nov 14, 2026"; '' when unset. Noon avoids a timezone shifting the day. */
export const formatShowDate = (d) =>
  d ? new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''

/** "Sat, Nov 14, 2026 · The Blue Room": the parts that are set. */
export const setlistWhenWhere = (s) => [formatShowDate(s.showDate), s.venue].filter(Boolean).join(' · ')

export const tuneCountLabel = (n) => `${n} ${n === 1 ? 'tune' : 'tunes'}`

/** The list rows with `saved` (a full setlist from the API) applied: its row's details and tune count updated. Other rows are untouched. */
export const withSavedSetlist = (rows, saved) =>
  rows.map((row) =>
    row.id === saved.id
      ? { ...row, name: saved.name, showDate: saved.showDate, venue: saved.venue, tuneCount: saved.items.filter((i) => i.kind === 'tune').length }
      : row,
  )
