import { describe, expect, it } from 'vitest'
import { ColorScale } from './ColorScale'
import { apcaContrast } from './APCAcontrast'
import { parseColor, rgbToOklch } from './oklch'

/** The stops a real scale is written with: a few hand-picked OKLCh values that
 * do not reach either end of the range. */
const blue = new ColorScale([
  'oklch(0.9 0.06 270)',
  'oklch(0.59 0.17 278)',
  'oklch(0.35 0.12 280)',
])

const grey = new ColorScale(['oklch(0.94 0.002 180)', 'oklch(0.22 0.01 140)'])

/** Splits `#rrggbb` or `rgba(…)` back into channels, the way the theme's own
 * helpers read a token value. */
function channels(color: string): [number, number, number, number] {
  if (color.startsWith('#')) {
    const int = parseInt(color.slice(1), 16)
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255, 1]
  }
  const parts = color
    .slice(color.indexOf('(') + 1, color.lastIndexOf(')'))
    .split(',')
    .map(parseFloat)
  return [parts[0], parts[1], parts[2], parts[3] ?? 1]
}

describe('ColorScale.at', () => {
  it('returns a colour at the lightness it was asked for', () => {
    // The whole system rests on this: a level is an address, so `at(0.53)` has
    // to actually measure 0.53 or a shared table of levels means nothing.
    for (const level of [0.1, 0.23, 0.4, 0.53, 0.64, 0.88, 0.96]) {
      const [r, g, b] = channels(blue.at(level))
      const measured = rgbToOklch({ r: r / 255, g: g / 255, b: b / 255 })
      expect(measured.l).toBeCloseTo(level, 2)
    }
  })

  it('runs to black and white whatever the stops were', () => {
    expect(blue.at(0)).toBe('#000000')
    expect(blue.at(1)).toBe('#ffffff')
    expect(grey.at(0)).toBe('#000000')
    expect(grey.at(1)).toBe('#ffffff')
  })

  it('clamps a level outside the range instead of extrapolating', () => {
    expect(blue.at(-1)).toBe(blue.at(0))
    expect(blue.at(2)).toBe(blue.at(1))
  })

  it('emits a notation the theme can read back', () => {
    // Theme tokens and their tests need to read generated values back. A
    // generated colour has to stay a literal — which both serializations are,
    // and
    // which no `rgb(from …)` expression would be.
    const levels = [0.2, 0.4, 0.6, 0.8]
    const lightnesses = levels.map(level => parseColor(blue.at(level)).l)
    expect(lightnesses).toEqual([...lightnesses].sort((a, b) => a - b))
  })

  it('keeps a hue on one side of the wheel', () => {
    // Interpolating 270 → 278 the short way stays in the blues. The long way
    // would swing through green, and a mid-level sample would give it away.
    const [r, g, b] = channels(blue.at(0.75))
    const { h } = rgbToOklch({ r: r / 255, g: g / 255, b: b / 255 })
    expect(h).toBeGreaterThan(265)
    expect(h).toBeLessThan(285)
  })

  it('does not drag an achromatic anchor towards red', () => {
    // The black and white anchors carry no chroma. If their hue were read as 0
    // rather than borrowed from the neighbour, a sample near either end would
    // pick up a red cast.
    const [r, _g, b] = channels(blue.at(0.97))
    expect(b).toBeGreaterThanOrEqual(r)
  })
})

describe('ColorScale.opaqueAt', () => {
  it('composites back over white to the colour it stands for', () => {
    for (const level of [0.3, 0.64, 0.88, 0.95]) {
      const [tr, tg, tb, alpha] = channels(grey.opaqueAt(level))
      const [or_, og, ob] = channels(grey.at(level))
      const over = (channel: number) => channel * alpha + 255 * (1 - alpha)
      expect(over(tr)).toBeCloseTo(or_, -0.5)
      expect(over(tg)).toBeCloseTo(og, -0.5)
      expect(over(tb)).toBeCloseTo(ob, -0.5)
    }
  })

  it('composites back over black for the inverted variant', () => {
    for (const level of [0.3, 0.5, 0.75]) {
      const [tr, tg, tb, alpha] = channels(grey.opaqueInvAt(level))
      const [or_, og, ob] = channels(grey.at(level))
      const over = (channel: number) => channel * alpha
      expect(over(tr)).toBeCloseTo(or_, -0.5)
      expect(over(tg)).toBeCloseTo(og, -0.5)
      expect(over(tb)).toBeCloseTo(ob, -0.5)
    }
  })

  it('is more transparent the closer the level sits to the background', () => {
    // A faint border is a faint alpha rather than a light colour, which is the
    // property that lets it sit on a surface it was not sampled against.
    const [, , , faint] = channels(grey.opaqueAt(0.95))
    const [, , , strong] = channels(grey.opaqueAt(0.3))
    expect(faint).toBeLessThan(strong)
  })

  it('stays opaque where nothing lighter exists', () => {
    expect(grey.opaqueAt(0)).toBe('#000000')
    expect(grey.opaqueInvAt(1)).toBe('#ffffff')
  })
})

describe('ColorScale contrast solving', () => {
  const measure = (text: string, background: string) => {
    const to255 = (color: string): [number, number, number] => {
      const [r, g, b] = channels(color)
      return [r, g, b]
    }
    return Math.abs(apcaContrast(to255(background), to255(text)))
  }

  it('lands on a colour that reaches the target as text', () => {
    const onWhite = blue.apcaOn(60, '#ffffff')
    expect(measure(onWhite, '#ffffff')).toBeGreaterThanOrEqual(59.5)
  })

  it('lands on a colour that reaches the target as a background', () => {
    const under = blue.apcaUnder(60, '#ffffff')
    expect(measure('#ffffff', under)).toBeGreaterThanOrEqual(59.5)
  })

  it('finds the closest passing colour, not merely a passing one', () => {
    // Asking for more contrast can only move away from the background, never
    // back towards it. If the search returned any passing colour rather than
    // the nearest one, this ordering would not hold.
    const levels = [45, 60, 75, 90].map(
      target => parseColor(blue.apcaOn(target, '#ffffff')).l
    )
    expect(levels).toEqual([...levels].sort((a, b) => b - a))
  })

  it('reverses direction for a dark reference', () => {
    // Against black the scale has to run lighter, not darker.
    const onBlack = blue.apcaOn(60, '#000000')
    const onWhite = blue.apcaOn(60, '#ffffff')
    expect(parseColor(onBlack).l).toBeGreaterThan(parseColor(onWhite).l)
  })

  it('gives its best colour when the target is out of reach', () => {
    // 108 is past what any sRGB pair can reach; building a theme should not
    // stop because one token asked for too much.
    expect(() => blue.apcaOn(108, '#ffffff')).not.toThrow()
    expect(blue.apcaOn(108, '#ffffff')).toBe('#000000')
  })
})

describe('ColorScale construction', () => {
  it('accepts stops in any order and in any notation', () => {
    const sorted = new ColorScale(['oklch(0.22 0.01 140)', '#f0f0ef'])
    const shuffled = new ColorScale(['#f0f0ef', 'oklch(0.22 0.01 140)'])
    expect(shuffled.at(0.5)).toBe(sorted.at(0.5))
  })

  it('works from a single stop', () => {
    // A tag colour arrives as one hex and has to become a whole ramp.
    const scale = new ColorScale(['#cc3077'])
    expect(scale.at(0)).toBe('#000000')
    expect(scale.at(1)).toBe('#ffffff')
    const { h } = parseColor(scale.at(0.5))
    expect(h).toBeCloseTo(parseColor('#cc3077').h, 0)
  })

  it('refuses an empty scale', () => {
    expect(() => new ColorScale([])).toThrow()
  })
})

describe('a P3 scale', () => {
  /* A red saturated past what sRGB holds — the case the wider gamut exists
     for. Written once and read at the same levels through both gamuts. */
  const stops = [
    'oklch(0.9 0.07 13)',
    'oklch(0.66 0.23 24)',
    'oklch(0.5 0.2 28)',
  ]
  const p3 = new ColorScale(stops, 'p3')
  const srgb = new ColorScale(stops)

  it('serializes to oklch, because no sRGB notation can spell it', () => {
    expect(p3.at(0.66)).toMatch(/^oklch\(/)
    expect(srgb.at(0.66)).toMatch(/^#/)
  })

  it('keeps chroma sRGB has to give up', () => {
    const wide = parseColor(p3.at(0.66))
    const narrow = parseColor(srgb.at(0.66))
    expect(wide.c).toBeGreaterThan(narrow.c)
  })

  it('never renders less chroma than sRGB, at any level', () => {
    // sRGB's primaries sit inside P3's, so the wider gamut can only ever hold
    // more of a colour. Stated over the whole range rather than at one level,
    // because where a level clamps is not something to hand-pick: a very light
    // red clamps in sRGB at a chroma of 0.015, which is easy to guess wrong.
    //
    // The sRGB form is quantized to 8-bit channels, so allow the tiny amount of
    // chroma that spelling can add around the edge of the gamut.
    for (let level = 0.05; level < 1; level += 0.05) {
      expect(parseColor(p3.at(level)).c).toBeGreaterThanOrEqual(
        parseColor(srgb.at(level)).c - 0.003
      )
    }
  })

  it('never moves lightness to gain the chroma', () => {
    // Two decimals, not three: the sRGB rendering is quantized to 8 bits per
    // channel, which is worth about 0.001 of lightness, and the OKLCh one is
    // rounded to three places when written down. Neither is the scale moving
    // a level — both are the cost of naming a colour in a stylesheet.
    for (const level of [0.5, 0.66, 0.8, 0.9]) {
      expect(parseColor(p3.at(level)).l).toBeCloseTo(level, 2)
      expect(parseColor(srgb.at(level)).l).toBeCloseTo(level, 2)
    }
  })

  it('takes the same contrast decision as the sRGB scale', () => {
    // The claim the whole two-format arrangement rests on: because clamping
    // only ever moves chroma, the level that satisfies a contrast target is
    // the same one in both gamuts. If this drifts, a P3 theme and an sRGB
    // theme stop being two renderings of one decision.
    for (const target of [45, 60, 75]) {
      const wide = parseColor(p3.apcaOn(target, '#ffffff'))
      const narrow = parseColor(srgb.apcaOn(target, '#ffffff'))
      expect(wide.l).toBeCloseTo(narrow.l, 2)
    }
  })

  it('solves transparency in P3 channels', () => {
    const transparent = parseColor(p3.opaqueAt(0.9))
    expect(transparent.alpha).toBeLessThan(1)
    expect(transparent.alpha).toBeGreaterThan(0)
  })

  it('reads an out-of-sRGB stop without collapsing it', () => {
    // Companding a negative linear channel is where this used to return NaN,
    // and a NaN compares false against every bound — so an out-of-gamut colour
    // would have been reported as fitting nothing and clamped to grey.
    const vividP3 = new ColorScale(['oklch(0.52 0.31 145)'], 'p3')
    const vividSrgb = new ColorScale(['oklch(0.52 0.31 145)'])
    expect(parseColor(vividP3.at(0.52)).c).toBeGreaterThan(
      parseColor(vividSrgb.at(0.52)).c
    )
  })
})
