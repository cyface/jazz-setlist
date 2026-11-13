/** Lowercase, without accents or punctuation, so "bernies" finds "Bernie’s Tune". */
export const normalize = (text) =>
  (text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Tunes matching `query`: every word of the query appears in the title or
 * composer. Best first: title starts with the query, then a title word does,
 * then the title contains it, then the rest; alphabetical within each.
 */
export function searchTunes(arrangements, query, limit = 8) {
  const q = normalize(query)
  if (!q) return []
  const words = q.split(' ')
  const rank = (title) => {
    if (title.startsWith(q)) return 0
    if (` ${title}`.includes(` ${q}`)) return 1
    if (title.includes(q)) return 2
    return 3
  }
  return arrangements
    .map((a) => ({ a, title: normalize(a.title), all: `${normalize(a.title)} ${normalize(a.composer)}` }))
    .filter(({ all }) => words.every((w) => all.includes(w)))
    .map((m) => ({ ...m, rank: rank(m.title) }))
    .sort((x, y) => x.rank - y.rank || x.title.localeCompare(y.title))
    .slice(0, limit)
    .map(({ a }) => a)
}
