import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const TRANSFORM = new URL('./transform.py', import.meta.url).pathname

/** One PolyNome preset use, in extract.py's raw.json shape. */
const occ = (name, when = 1) => ({ name, cue: '', tempo: 120, beats: 4, notes: [], when, setlist: null })

const RAW = {
  tunes: {
    // 🇧🇷 in the newest preset name wins, even over the STRAIGHT set.
    'Samba de Orfeu': { standalone: [occ('Samba de Orfeu', 1), occ('Samba de Orfeu 🇧🇷', 2)], setlist: [] },
    // In BOSSA: bossa without the emoji.
    'Blue Bossa': { standalone: [occ('Blue Bossa')], setlist: [] },
    // 🇧🇷 only in an older preset: the newest one decides.
    'Autumn Leaves': { standalone: [occ('Autumn Leaves 🇧🇷', 1), occ('Autumn Leaves', 2)], setlist: [] },
    'Red Clay': { standalone: [occ('Red Clay')], setlist: [] },
    'So What': { standalone: [occ('So What 📏')], setlist: [] },
    'Bags’ Groove': { standalone: [occ('Bags’ Groove')], setlist: [] },
  },
  setlists: [{ name: 'Gig', created: 'November 2026', notes: null, items: [] }],
}

let dir, feels
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'polynome-'))
  writeFileSync(join(dir, 'raw.json'), JSON.stringify(RAW))
  execFileSync('python3', ['-I', TRANSFORM, join(dir, 'raw.json'), join(dir, 'import.json')], { stdio: 'pipe' })
  const { arrangements } = JSON.parse(readFileSync(join(dir, 'import.json'), 'utf8'))
  feels = Object.fromEntries(arrangements.map((a) => [a.title, a.feel]))
})
afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('transform.py feel', () => {
  it('gives bossa for 🇧🇷 in the newest preset name, even for a STRAIGHT title', () => {
    expect(feels['Samba de Orfeu']).toBe('bossa')
  })

  it('gives bossa for a title in BOSSA without the emoji', () => {
    expect(feels['Blue Bossa']).toBe('bossa')
  })

  it('gives straight for 📏 or a title in STRAIGHT', () => {
    expect(feels['So What']).toBe('straight')
    expect(feels['Red Clay']).toBe('straight')
  })

  it('gives swing otherwise, ignoring 🇧🇷 on older presets', () => {
    expect(feels['Bags’ Groove']).toBe('swing')
    expect(feels['Autumn Leaves']).toBe('swing')
  })
})
