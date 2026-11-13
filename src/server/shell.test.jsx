import { describe, expect, it } from 'vitest'
import { Shell } from './shell.jsx'

const render = (dev) => String(<Shell dev={dev} version="9.9.9" />)

describe('Shell PWA tags', () => {
  it('links the manifest with credentials and the icons in production', () => {
    const html = render(false)
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" crossorigin="use-credentials"/>')
    expect(html).toContain('<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"/>')
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg"/>')
    expect(html).toContain('src="/assets/app.js?v=9.9.9"')
  })

  it('omits the manifest in dev, where no manifest is built', () => {
    const html = render(true)
    expect(html).not.toContain('rel="manifest"')
    expect(html).toContain('<link rel="icon" href="/favicon.ico" sizes="48x48"/>')
  })
})
