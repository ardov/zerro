import { describe, expect, it } from 'vitest'
import {
  advanceSpring,
  clickImpulse,
  defaultCurrencySettings,
} from './interaction'

describe('currency click interaction', () => {
  it('pushes away from the cursor with a soft, bounded radius', () => {
    const cursor = { x: 0, y: 0 }
    const near = clickImpulse({ x: 10, y: 0 }, cursor, 140, 180)
    const far = clickImpulse({ x: 100, y: 0 }, cursor, 140, 180)
    expect(near.x).toBeGreaterThan(far.x)
    expect(near.x).toBeLessThan(180)
    expect(near.y).toBe(0)
    expect(clickImpulse({ x: -10, y: 0 }, cursor, 140, 180).x).toBeLessThan(0)
    expect(clickImpulse({ x: 140, y: 0 }, cursor, 140, 180)).toEqual({
      x: 0,
      y: 0,
    })
    expect(clickImpulse(cursor, cursor, 140, 180)).toEqual({ x: 0, y: -180 })
  })

  it('returns displaced symbols to their moving anchors', () => {
    const state = { x: 0, y: 0, vx: defaultCurrencySettings.rowImpulse, vy: 0 }
    advanceSpring(state, 1 / 120, defaultCurrencySettings)
    expect(state.x).toBeGreaterThan(0)
    let settled = false
    for (let i = 0; i < 240; i++) {
      settled = advanceSpring(state, 1 / 120, defaultCurrencySettings)
    }
    expect(settled).toBe(true)
    expect(Math.abs(state.x)).toBeLessThan(0.02)
  })
})
