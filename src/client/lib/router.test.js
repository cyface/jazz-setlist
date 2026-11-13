import { describe, expect, it } from 'vitest'
import { matchRoute } from './router.js'

describe('matchRoute', () => {
  it.each([
    ['', { name: 'arrangements', id: null }],
    ['#/', { name: 'arrangements', id: null }],
    ['#/arrangements/abc-1', { name: 'arrangements', id: 'abc-1' }],
    ['#/arrangements/new', { name: 'arrangement-edit', id: null }],
    ['#/arrangements/abc-1/edit', { name: 'arrangement-edit', id: 'abc-1' }],
    ['#/setlists', { name: 'setlists', archived: false }],
    ['#/setlists/archived', { name: 'setlists', archived: true }],
    ['#/setlists/xyz', { name: 'setlist', id: 'xyz' }],
    ['#/nowhere/at/all', { name: 'not-found' }],
  ])('%s', (hash, expected) => {
    expect(matchRoute(hash)).toEqual(expected)
  })
})
