import { describe, expect, it } from 'vitest'
import { getColorSwatch, getSwatchTextColor } from './color'

describe('getColorSwatch', () => {
  it('maps known color names, using the first word as a fallback', () => {
    expect(getColorSwatch(' Black ')).toBe('#111111')
    expect(getColorSwatch('navy pinstripe')).toBe('#1f2a44')
    expect(getColorSwatch('Chartreuse')).toBe('#6b7280')
  })
})

describe('getSwatchTextColor', () => {
  it('uses light text on dark swatches and dark text on light ones', () => {
    const light = 'rgba(243, 241, 234, 0.92)'
    const dark = 'rgba(10, 10, 10, 0.9)'

    for (const color of ['black', 'navy', 'burgundy', 'brown', 'indigo', 'green']) {
      expect(getSwatchTextColor(getColorSwatch(color)), color).toBe(light)
    }
    for (const color of ['white', 'cream', 'champagne', 'silver']) {
      expect(getSwatchTextColor(getColorSwatch(color)), color).toBe(dark)
    }
  })
})
