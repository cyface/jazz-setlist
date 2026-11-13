/**
 * The add-to-setlist menu for a tune, from setlists listed with `hasTune`:
 * an "Add to" choice per active setlist, except that when the only active
 * setlist already has the tune, the menu just says so (`already`).
 */
export function addMenu(setlists) {
  const active = setlists.filter((s) => !s.archivedAt)
  if (active.length === 1 && active[0].hasTune) return { already: active[0], choices: [] }
  return { already: null, choices: active }
}

const TIMES = ['', 'once', 'twice']

/** Confirmation after adding `arrangement` to the returned `setlist`; notes when it's in there more than once. */
export function addedMessage(arrangement, setlist) {
  const count = setlist.items.filter((i) => i.arrangement?.id === arrangement.id).length
  const added = `Added “${arrangement.title}” to ${setlist.name}.`
  return count > 1 ? `${added} It’s in there ${TIMES[count] ?? `${count} times`} now.` : added
}
