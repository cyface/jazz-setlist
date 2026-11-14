import { describe, expect, it } from 'vitest'
import { afterEditPath, editTuneHref, matchRoute, withoutQuery } from './router.js'

describe('matchRoute', () => {
  it.each([
    ['', { name: 'arrangements', id: null }],
    ['#/', { name: 'arrangements', id: null }],
    ['#/arrangements/abc-1', { name: 'arrangements', id: 'abc-1' }],
    ['#/arrangements/new', { name: 'arrangement-edit', id: null }],
    ['#/arrangements/abc-1/edit', { name: 'arrangement-edit', id: 'abc-1' }],
    ['#/arrangements/abc-1/edit?setlist=s-1&tune=3', { name: 'arrangement-edit', id: 'abc-1', from: { setlistId: 's-1', index: 3 } }],
    ['#/setlists', { name: 'setlists', archived: false }],
    ['#/setlists/archived', { name: 'setlists', archived: true }],
    ['#/preferences', { name: 'preferences' }],
    ['#/setlists/xyz', { name: 'setlist', id: 'xyz' }],
    ['#/setlists/xyz?tune=0&arrangement=abc-1', { name: 'setlist', id: 'xyz', open: { index: 0, arrangementId: 'abc-1' } }],
    ['#/nowhere/at/all', { name: 'not-found' }],
  ])('%s', (hash, expected) => {
    expect(matchRoute(hash)).toStrictEqual(expected)
  })

  it.each([
    '#/arrangements/abc-1/edit?setlist=s-1',
    '#/arrangements/abc-1/edit?tune=3',
    '#/arrangements/abc-1/edit?setlist=s-1&tune=-1',
    '#/arrangements/abc-1/edit?setlist=s-1&tune=1.5',
    '#/arrangements/abc-1/edit?setlist=../evil&tune=1',
    '#/arrangements/abc-1/edit?setlist=https://example.com&tune=1',
  ])('ignores an incomplete or odd return target: %s', (hash) => {
    expect(matchRoute(hash)).toStrictEqual({ name: 'arrangement-edit', id: 'abc-1' })
  })

  it.each(['#/setlists/xyz?tune=1', '#/setlists/xyz?arrangement=a1', '#/setlists/xyz?tune=x&arrangement=a1'])(
    'ignores an incomplete tune to open: %s',
    (hash) => {
      expect(matchRoute(hash)).toStrictEqual({ name: 'setlist', id: 'xyz' })
    },
  )
})

describe('editing a tune from a setlist', () => {
  const from = { setlistId: 's-1', index: 3 }

  it('links the form with where it was opened from', () => {
    expect(editTuneHref('a1')).toBe('#/arrangements/a1/edit')
    expect(editTuneHref('a1', from)).toBe('#/arrangements/a1/edit?setlist=s-1&tune=3')
    expect(matchRoute(editTuneHref('a1', from)).from).toEqual(from)
  })

  it('goes back to the tune, or to that tune open in the setlist', () => {
    expect(afterEditPath('a1')).toBe('/arrangements/a1')
    expect(afterEditPath('a1', from)).toBe('/setlists/s-1?tune=3&arrangement=a1')
    expect(matchRoute(`#${afterEditPath('a1', from)}`)).toStrictEqual({
      name: 'setlist',
      id: 's-1',
      open: { index: 3, arrangementId: 'a1' },
    })
  })

  it('drops the query from a hash', () => {
    expect(withoutQuery('#/setlists/s-1?tune=3&arrangement=a1')).toBe('#/setlists/s-1')
    expect(withoutQuery('#/setlists/s-1')).toBe('#/setlists/s-1')
  })
})
