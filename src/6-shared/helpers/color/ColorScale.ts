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

/** Sample in OKLCh by lightness so one level means the same across hues and gamuts. */
export class ColorScale {
  private readonly stops: Oklch[]
  readonly gamut: Gamut

  constructor(colors: string[], gamut: Gamut = 'srgb') {
    if (colors.length === 0) throw new Error('A scale needs at least one stop')
    this.gamut = gamut

    const stops = colors.map(parseColor).sort((a, b) => a.l - b.l)

    if (stops[0].l > 0) stops.unshift({ l: 0, c: 0, h: stops[0].h })
    const last = stops[stops.length - 1]
    if (last.l < 1) stops.push({ l: 1, c: 0, h: last.h })

    this.stops = stops
  }

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

  at(level: number): string {
    return this.format(this.sampleAt(level))
  }

  private format(color: Oklch): string {
    return this.gamut === 'p3'
      ? formatOklch(color)
      : formatRgb(oklchToRgb(color))
  }

  /** Find the most transparent color that composites to this level over white, or black for opaqueInvAt. */
  opaqueAt(level: number): string {
    return this.opaqueOver(level, 1)
  }

  opaqueInvAt(level: number): string {
    return this.opaqueOver(level, 0)
  }

  /** @param background channel value the colour is composited over: 1 for
   * white, 0 for black. */
  private opaqueOver(level: number, background: number): string {
    /* Blend in the display's own RGB channels so P3 retains its extra chroma. */
    const { r, g, b } = toChannels(this.sampleAt(level), this.gamut)
    const channels = [r, g, b].map(channel => Math.min(1, Math.max(0, channel)))

    /* The channel farthest from the background sets the minimum representable alpha. */
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

  /** Find the closest passing level: apcaOn treats the result as text, and apcaUnder as background. */
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

  /** Contrast is monotonic only on each side of the reference. If the target is unreachable, return the closer endpoint. */
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

/** APCA uses sRGB. Clamp chroma before comparing so a P3 rendition has the same target lightness. */
const to255 = (color: Oklch): [number, number, number] => {
  const { r, g, b } = oklchToRgb(clampChroma(color, 'srgb'))
  return [
    Math.min(255, Math.max(0, r * 255)),
    Math.min(255, Math.max(0, g * 255)),
    Math.min(255, Math.max(0, b * 255)),
  ]
}

/** Weight by chroma so gray borrows its colored neighbor's hue; otherwise take the short hue path. */
function interpolateHue(from: Oklch, to: Oklch, t: number): number {
  if (from.c < 1e-6) return to.h
  if (to.c < 1e-6) return from.h

  let delta = to.h - from.h
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return (from.h + delta * t + 360) % 360
}
