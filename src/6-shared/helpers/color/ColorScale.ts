import { apcaContrast } from './APCAcontrast'
import type { Gamut, Oklch, Rgb } from './oklch'
import {
  clampChroma,
  formatOklch,
  formatRgb,
  fromChannels,
  oklchToRgb,
  parseColor,
  toChannels,
} from './oklch'

/** A continuous ramp through a few colour stops, addressed by lightness.
 *
 * The point is that lightness stops being something a colour *has* and becomes
 * the coordinate a colour is *chosen by*: `at(0.23)` is the same visual step
 * on every scale, so one table of levels can drive every hue, and a second
 * table drives the dark scheme without a second set of hand-picked values.
 *
 * Stops are sorted by lightness and extended to pure black and pure white, so
 * the domain is always the whole 0…1 range and no level can fall off an end.
 *
 * Sampling happens in OKLCh, where a fixed lightness step looks like a fixed
 * step. An sRGB scale serializes to `#rrggbb` and `rgba()`; a P3 one has to
 * serialize to `oklch()`, because no sRGB notation can spell a colour outside
 * sRGB. Both are literals `parseColor` reads back, so which one a scale uses
 * is a choice about reach, not about whether its output stays inspectable.
 *
 * The two renderings of a level differ only in chroma — clamping never moves
 * lightness — so a contrast decision taken against one holds for the other. */
export class ColorScale {
  private readonly stops: Oklch[]
  readonly gamut: Gamut

  constructor(colors: string[], gamut: Gamut = 'srgb') {
    if (colors.length === 0) throw new Error('A scale needs at least one stop')
    this.gamut = gamut

    const stops = colors.map(parseColor).sort((a, b) => a.l - b.l)

    /* Anchoring both ends keeps `at` total. The anchors drop chroma to zero
       rather than carrying the neighbouring hue, because a scale run to its
       extreme is black or white — a tinted one would make `at(0)` and `at(1)`
       differ between hues that should agree there. */
    if (stops[0].l > 0) stops.unshift({ l: 0, c: 0, h: stops[0].h })
    const last = stops[stops.length - 1]
    if (last.l < 1) stops.push({ l: 1, c: 0, h: last.h })

    this.stops = stops
  }

  /** The colour at lightness `level`, in the scale's target gamut. */
  private sampleAt(level: number): Oklch {
    const l = Math.min(1, Math.max(0, level))

    let index = 1
    while (index < this.stops.length - 1 && this.stops[index].l < l) index++
    const from = this.stops[index - 1]
    const to = this.stops[index]

    const span = to.l - from.l
    /* Coincident stops would divide by zero. Taking the upper one matches the
       search above, which stops at the first stop at or past `l`. */
    const t = span < 1e-9 ? 1 : (l - from.l) / span

    return clampChroma(
      {
        l,
        c: from.c + (to.c - from.c) * t,
        h: interpolateHue(from, to, t),
      },
      this.gamut
    )
  }

  /** The colour at lightness `level`. */
  at(level: number): string {
    return this.format(this.sampleAt(level))
  }

  private format(color: Oklch): string {
    return this.gamut === 'p3'
      ? formatOklch(color)
      : formatRgb(oklchToRgb(color))
  }

  /** The most transparent colour that looks like `at(level)` over white, and
   * `opaqueInvAt` the same over black.
   *
   * This is what makes a border or a divider a derived value rather than a
   * decision: instead of writing `rgba(0, 0, 0, 0.12)` and hoping it reads on
   * every surface, pick the level the border should sit at and let the scale
   * say which translucent colour composites to it. */
  opaqueAt(level: number): string {
    return this.opaqueOver(level, 1)
  }

  opaqueInvAt(level: number): string {
    return this.opaqueOver(level, 0)
  }

  /** @param background channel value the colour is composited over: 1 for
   * white, 0 for black. */
  private opaqueOver(level: number, background: number): string {
    /* Compositing happens in the channels the display actually blends, so a P3
       scale has to solve this in P3 channels — solving it in sRGB would first
       throw away the chroma that made the scale P3 in the first place. */
    const { r, g, b } = toChannels(this.sampleAt(level), this.gamut)
    const channels = [r, g, b].map(channel => Math.min(1, Math.max(0, channel)))

    /* The channel furthest from the background is the one that saturates
       first, so its distance is the strongest alpha that keeps every channel
       representable. */
    const alpha = Math.max(...channels.map(c => Math.abs(c - background)))
    if (alpha < 1e-4) {
      return this.formatChannels({
        r: background,
        g: background,
        b: background,
      })
    }

    const [r2, g2, b2] = channels.map(
      channel => (channel - background * (1 - alpha)) / alpha
    )
    return this.formatChannels({ r: r2, g: g2, b: b2, alpha })
  }

  private formatChannels(color: Rgb): string {
    return this.gamut === 'p3'
      ? formatOklch(fromChannels(color, 'p3'))
      : formatRgb(color)
  }

  /** The lightest or darkest colour on this scale that still reads at
   * `targetLc` APCA **as text on** `background`. `apcaUnder` is the same
   * question asked the other way round: as a **background under** `text`.
   *
   * Contrast becomes a constraint the colour is solved for rather than a
   * property checked afterwards — which is the difference between "this
   * passes" and "this is the closest colour that passes". */
  apcaOn(targetLc: number, background: string): string {
    const bg = parseColor(background)
    return this.solveForContrast(targetLc, sample =>
      Math.abs(apcaContrast(to255(bg), to255(sample)))
    )
  }

  apcaUnder(targetLc: number, text: string): string {
    const fg = parseColor(text)
    return this.solveForContrast(targetLc, sample =>
      Math.abs(apcaContrast(to255(sample), to255(fg)))
    )
  }

  /** Bisects on lightness for the first level reaching `target`.
   *
   * Contrast against a fixed reference is monotonic in lightness on either
   * side of that reference, but which way it runs depends on whether the
   * reference is darker or lighter than the scale's ends — so the direction is
   * read off the endpoints rather than assumed. When neither end reaches the
   * target, the closer end is returned: a scale that cannot satisfy the
   * constraint should give its best colour, not throw in the middle of
   * building a theme. */
  private solveForContrast(
    target: number,
    contrastAt: (sample: Oklch) => number
  ): string {
    const contrast = (l: number) => contrastAt(this.sampleAt(l))

    const atDark = contrast(0)
    const atLight = contrast(1)
    const rising = atLight >= atDark

    if (Math.max(atDark, atLight) < target) return this.at(rising ? 1 : 0)
    if (Math.min(atDark, atLight) >= target) return this.at(rising ? 0 : 1)

    let low = 0
    let high = 1
    while (high - low > 1e-4) {
      const mid = (low + high) / 2
      /* `low` always holds a level below target and `high` one at or above it
         when rising, and the mirror image when falling. */
      if (contrast(mid) >= target === rising) high = mid
      else low = mid
    }
    return this.at(rising ? high : low)
  }
}

/** APCA is defined over sRGB, so a P3 colour is answered for at its sRGB
 * rendering. Chroma is clamped rather than the channels clipped: clipping
 * moves lightness, and lightness is very nearly the whole of the contrast.
 * Clamping leaves it exactly where the level put it, which is what lets one
 * contrast decision serve both renderings of a colour. */
const to255 = (color: Oklch): [number, number, number] => {
  const { r, g, b } = oklchToRgb(clampChroma(color, 'srgb'))
  return [
    Math.min(255, Math.max(0, r * 255)),
    Math.min(255, Math.max(0, g * 255)),
    Math.min(255, Math.max(0, b * 255)),
  ]
}

/** Weighted by chroma, so a stop with no chroma — the black and white anchors,
 * or a grey — adopts its neighbour's hue instead of dragging the ramp towards
 * an arbitrary one. Otherwise the shorter way round the wheel. */
function interpolateHue(from: Oklch, to: Oklch, t: number): number {
  if (from.c < 1e-6) return to.h
  if (to.c < 1e-6) return from.h

  let delta = to.h - from.h
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return (from.h + delta * t + 360) % 360
}
