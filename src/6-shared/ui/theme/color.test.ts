import { describe, expect, it } from 'vitest'
import { alpha, getContrastText, getLuminance } from './color'

describe('alpha', () => {
  it('replaces an alpha rather than multiplying it', () => {
    // The state fills are built on `action.selected`, which is already
    // transparent. A mix would land at 0.08 × 0.12; replacement lands at 0.12.
    // It is the difference between a visible row and an invisible
    // one.
    expect(alpha('rgba(0, 0, 0, 0.08)', 0.12)).toBe('rgba(0, 0, 0, 0.12)')
  })

  it('reads the notations the palette is written in', () => {
    expect(alpha('#37474f', 0.5)).toBe('rgba(55, 71, 79, 0.5)')
    expect(alpha('#fff', 0.04)).toBe('rgba(255, 255, 255, 0.04)')
    expect(alpha('rgb(97, 97, 97)', 0.92)).toBe('rgba(97, 97, 97, 0.92)')
  })
})

describe('getContrastText', () => {
  // A tag's colour is the user's, and is the one case that has to be computed
  // rather than looked up.
  it('picks a side for a tag colour', () => {
    expect(getContrastText('#607d8b')).toBe('#fff')
    expect(getContrastText('#3f51b5')).toBe('#fff')
    expect(getContrastText('#ff9800')).toBe('rgba(0, 0, 0, 0.87)')
    expect(getContrastText('#ffff8d')).toBe('rgba(0, 0, 0, 0.87)')
  })
})

describe('wide-gamut values', () => {
  it('replaces an alpha without leaving the notation', () => {
    // An sRGB spelling would silently narrow a P3 palette value on its way
    // into a state fill, and every hover would be duller than the colour it
    // was derived from.
    expect(alpha('oklch(0.53 0.12 240)', 0.6)).toBe(
      'oklch(0.53 0.12 240 / 0.6)'
    )
  })

  it('measures a luminance instead of returning NaN', () => {
    // The old parser read `oklch(L C H)` as a comma-separated triple, found
    // one number, and produced NaN — which `getContrastRatio` then propagated
    // into a contrast that compared false against every threshold.
    const luminance = getLuminance('oklch(0.53 0.12 240)')
    expect(Number.isNaN(luminance)).toBe(false)
    expect(luminance).toBeGreaterThan(0)
    expect(luminance).toBeLessThan(1)
  })

  it('picks contrasting text for an oklch background', () => {
    expect(getContrastText('oklch(0.23 0.02 240)')).toBe('#fff')
    expect(getContrastText('oklch(0.96 0.02 240)')).toBe('rgba(0, 0, 0, 0.87)')
  })
})
