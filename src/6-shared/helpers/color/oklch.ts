/** The OKLab/OKLCh ↔ sRGB and Display P3 conversions `ColorScale` samples
 * through.
 *
 * Vendored rather than taken from a colour library for the same reason
 * `APCAcontrast.ts` is: these are fixed matrices from a published
 * specification, they are the only part of such a library this app would call,
 * and a scale that generates the palette at runtime would put the whole
 * library in the bundle. The constants are Björn Ottosson's
 * (https://bottosson.github.io/posts/oklab/); the transfer curve is the sRGB
 * piecewise one, not the 2.4 power approximation `APCAcontrast.ts` uses, which
 * is deliberate — APCA specifies its own linearization and this does not share
 * it. */

export type Oklch = { l: number; c: number; h: number; alpha?: number }
export type Rgb = { r: number; g: number; b: number; alpha?: number }

/** Which set of primaries a colour has to fit inside. sRGB contains no colour
 * P3 does not, so this only ever widens what a scale may keep. */
export type Gamut = 'srgb' | 'p3'

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** sRGB companding — shared by Display P3, which differs only in primaries.
 *
 * Applied through the magnitude and the sign put back afterwards, as CSS Color
 * 4 specifies. A channel outside 0…1 is not a mistake to be clamped away here:
 * it is how a colour states that it falls outside these primaries, and it is
 * the only thing the gamut checks have to read. Companding it directly would
 * raise a negative number to a fractional power and hand back `NaN`, which
 * every comparison downstream would then answer `false` to. */
const gammaEncode = (channel: number) => {
  const magnitude = Math.abs(channel)
  const encoded =
    magnitude <= 0.0031308
      ? 12.92 * magnitude
      : 1.055 * magnitude ** (1 / 2.4) - 0.055
  return Math.sign(channel) * encoded
}

const gammaDecode = (channel: number) => {
  const magnitude = Math.abs(channel)
  const decoded =
    magnitude <= 0.04045
      ? magnitude / 12.92
      : ((magnitude + 0.055) / 1.055) ** 2.4
  return Math.sign(channel) * decoded
}

/** Linear-light sRGB, before companding. Channels outside 0…1 are meaningful
 * here: they are exactly how a colour says it sits outside the sRGB gamut, and
 * the P3 conversion below needs to see them. */
function oklchToLinearSrgb(color: Oklch): Rgb {
  const hue = (color.h * Math.PI) / 180
  const a = color.c * Math.cos(hue)
  const b = color.c * Math.sin(hue)

  const lCone = (color.l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const mCone = (color.l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const sCone = (color.l - 0.0894841775 * a - 1.291485548 * b) ** 3

  return {
    r: 4.0767416621 * lCone - 3.3077115913 * mCone + 0.2309699292 * sCone,
    g: -1.2684380046 * lCone + 2.6097574011 * mCone - 0.3413193965 * sCone,
    b: -0.0041960863 * lCone - 0.7034186147 * mCone + 1.707614701 * sCone,
    alpha: color.alpha,
  }
}

export function oklchToRgb(color: Oklch): Rgb {
  const linear = oklchToLinearSrgb(color)
  return {
    r: gammaEncode(linear.r),
    g: gammaEncode(linear.g),
    b: gammaEncode(linear.b),
    alpha: color.alpha,
  }
}

/* Linear sRGB ↔ linear Display P3. Both share white point and transfer curve,
   so only the primaries differ and a single matrix carries the whole
   conversion. sRGB's primaries sit inside P3's, which is why the forward
   matrix maps the unit cube into itself and the reverse one does not. */
const toLinearP3 = (color: Rgb): Rgb => ({
  r: 0.8224621 * color.r + 0.177538 * color.g,
  g: 0.0331941 * color.r + 0.9668058 * color.g,
  b: 0.0170827 * color.r + 0.0723974 * color.g + 0.9105199 * color.b,
  alpha: color.alpha,
})

const fromLinearP3 = (color: Rgb): Rgb => ({
  r: 1.2249401 * color.r - 0.2249401 * color.g,
  g: -0.0420569 * color.r + 1.0420569 * color.g,
  b: -0.0196376 * color.r - 0.0786361 * color.g + 1.0982736 * color.b,
  alpha: color.alpha,
})

/** The companded channels a colour is composited in on a display of `gamut`. */
export function toChannels(color: Oklch, gamut: Gamut): Rgb {
  const linear = oklchToLinearSrgb(color)
  const target = gamut === 'p3' ? toLinearP3(linear) : linear
  return {
    r: gammaEncode(target.r),
    g: gammaEncode(target.g),
    b: gammaEncode(target.b),
    alpha: color.alpha,
  }
}

/** The inverse of `toChannels`. */
export function fromChannels(color: Rgb, gamut: Gamut): Oklch {
  const linear = {
    r: gammaDecode(color.r),
    g: gammaDecode(color.g),
    b: gammaDecode(color.b),
    alpha: color.alpha,
  }
  const srgb = gamut === 'p3' ? fromLinearP3(linear) : linear
  return linearSrgbToOklch(srgb)
}

export function rgbToOklch(color: Rgb): Oklch {
  return linearSrgbToOklch({
    r: gammaDecode(color.r),
    g: gammaDecode(color.g),
    b: gammaDecode(color.b),
    alpha: color.alpha,
  })
}

function linearSrgbToOklch(color: Rgb): Oklch {
  const { r, g, b } = color

  const lCone = Math.cbrt(
    0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  )
  const mCone = Math.cbrt(
    0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  )
  const sCone = Math.cbrt(
    0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
  )

  const lightness =
    0.2104542553 * lCone + 0.793617785 * mCone - 0.0040720468 * sCone
  const a = 1.9779984951 * lCone - 2.428592205 * mCone + 0.4505937099 * sCone
  const bAxis =
    0.0259040371 * lCone + 0.7827717662 * mCone - 0.808675766 * sCone

  const chroma = Math.sqrt(a * a + bAxis * bAxis)
  /* An achromatic colour has no meaningful hue, and `atan2(0, 0)` would report
     0 — a red that interpolation would then drag a scale through. Reporting
     `NaN`-free 0 with a zero chroma is safe because every consumer here reads
     hue only after weighting it by chroma. */
  const hue = chroma < 1e-6 ? 0 : (Math.atan2(bAxis, a) * 180) / Math.PI

  return { l: lightness, c: chroma, h: (hue + 360) % 360, alpha: color.alpha }
}

/** Whether every channel fits between the primaries of `gamut`. The tolerance
 * is a little over half an 8-bit step, so a colour that only misses by less
 * than one renders identically to one that fits. */
const inGamut = (color: Oklch, gamut: Gamut) => {
  const { r, g, b } = toChannels(color, gamut)
  return [r, g, b].every(channel => channel >= -0.002 && channel <= 1.002)
}

/** The same colour at the highest chroma `gamut` can hold, found by bisection
 * on chroma with lightness and hue fixed. Reducing chroma is what the eye
 * forgives; moving lightness would break the level the scale was sampled at,
 * which is the one thing every contrast decision downstream depends on — and
 * it is why the sRGB and P3 renderings of one level stay interchangeable for
 * every contrast question. */
export function clampChroma(color: Oklch, gamut: Gamut = 'srgb'): Oklch {
  if (inGamut(color, gamut)) return color

  let low = 0
  let high = color.c
  while (high - low > 1e-4) {
    const mid = (low + high) / 2
    if (inGamut({ ...color, c: mid }, gamut)) low = mid
    else high = mid
  }
  return { ...color, c: low }
}

/** Parses the notations a scale's stops are written in: `oklch(L C H)` with an
 * optional `/ alpha`, `#rgb`, `#rrggbb`, `rgb(…)` and `rgba(…)`. Percentages
 * are accepted on OKLCh lightness because that is how the notation is
 * usually written by hand. */
export function parseColor(color: string): Oklch {
  const value = color.trim()

  if (value.startsWith('oklch')) {
    const parts = value
      .slice(value.indexOf('(') + 1, value.lastIndexOf(')'))
      .split('/')
    const [l, c, h] = parts[0]
      .trim()
      .split(/[\s,]+/)
      .map(part =>
        part.endsWith('%') ? parseFloat(part) / 100 : parseFloat(part)
      )
    const alpha = parts[1] === undefined ? undefined : parseFloat(parts[1])
    return { l, c: c || 0, h: h || 0, alpha }
  }

  return rgbToOklch(parseRgb(value))
}

function parseRgb(color: string): Rgb {
  if (color.startsWith('#')) {
    const digits = color.slice(1)
    const full =
      digits.length < 6
        ? [...digits]
            .map(digit => digit + digit)
            .join('')
            .slice(0, 6)
        : digits.slice(0, 6)
    const int = parseInt(full, 16)
    return {
      r: ((int >> 16) & 255) / 255,
      g: ((int >> 8) & 255) / 255,
      b: (int & 255) / 255,
    }
  }

  const parts = color
    .slice(color.indexOf('(') + 1, color.lastIndexOf(')'))
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(parseFloat)
  return {
    r: parts[0] / 255,
    g: parts[1] / 255,
    b: parts[2] / 255,
    alpha: parts[3],
  }
}

/** Serializes an OKLCh literal — the only notation that can carry a colour
 * outside sRGB. Rounded, because the trailing digits of a bisection are noise
 * that would otherwise make one build's tokens differ from the next.
 *
 * A literal, not an expression: `oklch(0.53 0.12 240 / 0.6)` is a value
 * `parseColor` reads straight back, which is what `colors.ts` needs of a token
 * and what `rgb(from var(--x) …)` could never be. */
export function formatOklch(color: Oklch): string {
  const round = (value: number, places: number) => {
    const factor = 10 ** places
    return Math.round(value * factor) / factor
  }
  const base = `${round(color.l, 3)} ${round(color.c, 3)} ${round(color.h, 1)}`
  const alpha = color.alpha === undefined ? 1 : round(clamp01(color.alpha), 3)
  return alpha >= 1 ? `oklch(${base})` : `oklch(${base} / ${alpha})`
}

/** Serializes to the sRGB notations the theme is written in today: `#rrggbb`
 * when opaque, `rgba(r, g, b, a)` otherwise — the exact spelling `alpha()` in
 * `ui/theme/color.ts` produces. */
export function formatRgb(color: Rgb): string {
  const r = Math.round(clamp01(color.r) * 255)
  const g = Math.round(clamp01(color.g) * 255)
  const b = Math.round(clamp01(color.b) * 255)
  /* Rounded before the comparison, not after: a colour that comes back from
     the conversions at 0.9999996 is opaque once written down, and printing it
     as `rgba(…, 1)` would be a second spelling of a value the hex branch
     already has. */
  const alpha =
    color.alpha === undefined
      ? 1
      : Math.round(clamp01(color.alpha) * 1000) / 1000
  if (alpha >= 1) {
    const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
    return `#${hex}`
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
