import { describe, expect, it } from 'vitest'
import { createGlyphPile } from './physics'
import type { GlyphSeed } from './physics'

const glyph = (x: number, y: number): GlyphSeed => ({
  x,
  y,
  width: 10,
  height: 16,
  angle: 0,
  velocityX: 0,
  velocityY: 0,
})

describe('currency glyph pile', () => {
  it('keeps later regions pinned while earlier glyphs are already falling', () => {
    const seeds = [glyph(40, 30), glyph(180, 30), glyph(320, 30)]
    const pile = createGlyphPile(seeds, 360, 600)
    try {
      const first = pile.releaseDelays.indexOf(Math.min(...pile.releaseDelays))
      const last = pile.releaseDelays.indexOf(Math.max(...pile.releaseDelays))
      for (let i = 0; i < 24; i++) expect(pile.advance(1000 / 60)).toBe(false)
      expect(pile.bodies[first].isStatic).toBe(false)
      expect(pile.bodies[first].position.y).toBeGreaterThan(seeds[first].y + 20)
      expect(pile.bodies[last].isStatic).toBe(true)
      expect(pile.bodies[last].position).toEqual({
        x: seeds[last].x,
        y: seeds[last].y,
      })
      while (pile.elapsed <= Math.max(...pile.releaseDelays) + 1000 / 60)
        pile.advance(1000 / 60)
      expect(pile.bodies.every(body => !body.isStatic)).toBe(true)
    } finally {
      pile.dispose()
    }
  })

  it('drops glyphs onto each other and the floor, then stops', () => {
    const pile = createGlyphPile([glyph(100, 30), glyph(100, 80)], 200, 200)
    try {
      let settled = false
      for (let i = 0; i < 660 && !settled; i++)
        settled = pile.advance(1000 / 60)
      const [top, bottom] = pile.bodies
      expect(settled).toBe(true)
      expect(bottom.bounds.max.y).toBeCloseTo(200, 0)
      expect(top.bounds.max.y).toBeCloseTo(bottom.bounds.min.y, 0)
      expect(bottom.position.y - top.position.y).toBeGreaterThan(15)
      const positions = pile.bodies.map(body => ({ ...body.position }))
      pile.advance(1000 / 60)
      expect(pile.bodies.map(body => body.position)).toEqual(positions)
    } finally {
      pile.dispose()
    }
  })

  it('uses the same gravity at different display refresh rates', () => {
    const slow = createGlyphPile([glyph(100, 30)], 200, 1000)
    const fast = createGlyphPile([glyph(100, 30)], 200, 1000)
    try {
      for (let i = 0; i < 30; i++) slow.advance(1000 / 30)
      for (let i = 0; i < 120; i++) fast.advance(1000 / 120)
      expect(slow.bodies[0].position.y).toBeGreaterThan(100)
      expect(slow.bodies[0].position.y).toBeCloseTo(
        fast.bodies[0].position.y,
        5
      )
    } finally {
      slow.dispose()
      fast.dispose()
    }
  })

  it('wakes the settled pile on a click and falls again without returning to an anchor', () => {
    const pile = createGlyphPile([glyph(100, 30)], 400, 200)
    try {
      for (let i = 0; i < 660; i++) pile.advance(1000 / 60)
      const body = pile.bodies[0]
      expect(body.isSleeping).toBe(true)
      expect(pile.repulse({ x: 90, y: 195 })).toBe(true)
      expect(body.isSleeping).toBe(false)
      expect(body.velocity.x).toBeGreaterThan(0)
      expect(body.velocity.y).toBeLessThan(0)
      for (let i = 0; i < 10; i++) pile.advance(1000 / 60)
      expect(body.position.y).toBeLessThan(185)
      for (let i = 0; i < 660; i++) pile.advance(1000 / 60)
      expect(body.position.x).toBeGreaterThan(120)
      expect(body.bounds.max.y).toBeCloseTo(200, 0)
      expect(body.isSleeping).toBe(true)
    } finally {
      pile.dispose()
    }
  })

  it('keeps glyph dimensions and follows the floor when resized', () => {
    const pile = createGlyphPile([glyph(190, 80)], 200, 200)
    try {
      for (let i = 0; i < 660; i++) pile.advance(1000 / 60)
      const area = pile.bodies[0].area
      pile.resize(100, 300)
      for (let i = 0; i < 660; i++) pile.advance(1000 / 60)
      const body = pile.bodies[0]
      expect(body.area).toBe(area)
      expect(body.bounds.max.y).toBeCloseTo(300, 0)
      expect(body.isSleeping).toBe(true)
    } finally {
      pile.dispose()
    }
  })

  it('stops after an escaped glyph falls below the floor and leaves it out on resize', () => {
    const pile = createGlyphPile(
      [{ ...glyph(1, 40), velocityX: -300 }],
      200,
      200
    )
    try {
      let settled = false
      for (let i = 0; i < 360 && !settled; i++)
        settled = pile.advance(1000 / 60)
      const body = pile.bodies[0]
      expect(settled).toBe(true)
      expect(pile.elapsed).toBeLessThan(6000)
      expect(body.bounds.min.y).toBeGreaterThan(300)
      const position = { ...body.position }
      pile.resize(400, 600)
      expect(body.position).toEqual(position)
      expect(pile.repulse(position)).toBe(false)
      expect(pile.advance(1000 / 60)).toBe(true)
    } finally {
      pile.dispose()
    }
  })
})
