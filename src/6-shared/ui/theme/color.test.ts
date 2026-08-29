import { describe, expect, it } from 'vitest'
import { alpha, getContrastText } from './color'
import { palettes } from './palette'

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
  // Recompute every static `contrastText` value to keep the helper and palette
  // in agreement.
  it('reproduces every contrastText the palette carries', () => {
    const names = [
      'primary',
      'secondary',
      'success',
      'error',
      'warning',
      'info',
    ] as const

    Object.values(palettes).forEach(palette => {
      names.forEach(name => {
        expect([
          palette.mode,
          name,
          getContrastText(palette[name].main),
        ]).toEqual([palette.mode, name, palette[name].contrastText])
      })
    })
  })

  // A tag's colour is the user's, and is the one case that has to be computed
  // rather than looked up.
  it('picks a side for a tag colour', () => {
    expect(getContrastText('#607d8b')).toBe('#fff')
    expect(getContrastText('#3f51b5')).toBe('#fff')
    expect(getContrastText('#ff9800')).toBe('rgba(0, 0, 0, 0.87)')
    expect(getContrastText('#ffff8d')).toBe('rgba(0, 0, 0, 0.87)')
  })
})
