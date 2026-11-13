import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const TRANSFORM = new URL('./transform.py', import.meta.url).pathname

/** One PolyNome preset use, in extract.py's raw.json shape. */
const occ = (name, when = 1, cue = '') => ({ name, cue, tempo: 120, beats: 4, notes: [], when, setlist: null })

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
    // In LATIN: latin even though its newest preset says 📏 (as in the real backup).
    'Song for My Father': {
      standalone: [occ('Song for My Father 🎤/🐟 LATIN', 1, ' 🎤/🐟 LATIN'), occ('Song for My Father🎤📏💃', 2, '🎤📏💃')],
      setlist: [],
    },
    'Chitlins con Carne': { standalone: [occ('Chitlins Con Carne - 3/2 CLAVE', 1, ' - 3/2 CLAVE')], setlist: [] },
    // "LATIN" in the newest preset name wins over the STRAIGHT set.
    'Watermelon Man': { standalone: [occ('Watermelon Man - LATIN', 1, ' - LATIN')], setlist: [] },
    // 💃 is latin too, and wins over 📏 in the same name.
    'Oye Como Va': { standalone: [occ('Oye Como Va📏💃', 1, '📏💃')], setlist: [] },
  },
  setlists: [{ name: 'Gig', created: 'November 2026', notes: null, items: [] }],
}

let dir, feels, notes
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'polynome-'))
  writeFileSync(join(dir, 'raw.json'), JSON.stringify(RAW))
  execFileSync('python3', ['-I', TRANSFORM, join(dir, 'raw.json'), join(dir, 'import.json')], { stdio: 'pipe' })
  const { arrangements } = JSON.parse(readFileSync(join(dir, 'import.json'), 'utf8'))
  feels = Object.fromEntries(arrangements.map((a) => [a.title, a.feel]))
  notes = Object.fromEntries(arrangements.map((a) => [a.title, a.notes]))
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

  it('gives latin for a title in LATIN, even when its newest preset says 📏', () => {
    expect(feels['Song for My Father']).toBe('latin')
    expect(feels['Chitlins con Carne']).toBe('latin')
  })

  it('gives latin for "LATIN" in the newest preset name, even for a STRAIGHT title', () => {
    expect(feels['Watermelon Man']).toBe('latin')
  })

  it('gives latin for 💃 in the newest preset name, even with 📏 and for a STRAIGHT title', () => {
    expect(feels['Oye Como Va']).toBe('latin')
  })

  it('leaves the LATIN and 💃 cues out of the notes', () => {
    expect(notes['Watermelon Man'] ?? '').not.toMatch(/latin/i)
    expect(notes['Oye Como Va'] ?? '').not.toMatch(/latin|💃/i)
    expect(notes['Song for My Father']).not.toMatch(/latin|💃/i)
    expect(notes['Song for My Father']).toMatch(/PolyNome cues: bass/)
  })

  it('gives swing otherwise, ignoring 🇧🇷 on older presets', () => {
    expect(feels['Bags’ Groove']).toBe('swing')
    expect(feels['Autumn Leaves']).toBe('swing')
  })
})
