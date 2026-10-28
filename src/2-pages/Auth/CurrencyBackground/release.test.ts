import { expect, it } from 'vitest'
import { createReleaseDelays } from './release'

it('spreads release across the screen while keeping neighboring glyphs together', () => {
  const points = Array.from({ length: 100 }, (_, i) => ({
    x: (i % 10) * 90 + 30,
    y: Math.floor(i / 10) * 60 + 30,
  }))
  const delays = createReleaseDelays([...points, { x: 301, y: 210 }], 900, 600)
  expect(Math.min(...delays)).toBe(0)
  expect(Math.max(...delays)).toBeCloseTo(1800)
  expect(delays.filter(delay => delay < 600).length).toBeGreaterThan(0)
  expect(delays.filter(delay => delay > 1200).length).toBeGreaterThan(0)
  // The added point is 1 CSS pixel from a point in the fourth row.
  expect(Math.abs(delays[33] - delays[100])).toBeLessThan(20)
})
