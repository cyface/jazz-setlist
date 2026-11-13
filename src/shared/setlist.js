/**
 * Tunes get `set` and `number` (position within the set); a break gets
 * `endsSet`, the number of the set it closes.
 */
export function numberSets(items) {
  let set = 1
  let number = 0
  return items.map((item) => {
    if (item.kind === 'break') {
      const out = { ...item, endsSet: set }
      set += 1
      number = 0
      return out
    }
    number += 1
    return { ...item, set, number }
  })
}

export function moveItem(items, from, to) {
  if (to < 0 || to >= items.length || from === to) return items
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
