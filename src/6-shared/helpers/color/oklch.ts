/** OKLab matrices: https://bottosson.github.io/posts/oklab/. Companding follows CSS Color 4. */

export type Oklch = { l: number; c: number; h: number; alpha?: number }
export type Rgb = { r: number; g: number; b: number; alpha?: number }

export type Gamut = 'srgb' | 'p3'

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** Compand the magnitude and restore the sign; out-of-gamut channels must not become NaN. */
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

/** Linear channels can fall outside 0…1 before gamut conversion. */
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
  /* Achromatic hue is arbitrary; interpolation weights it by chroma. */
  const hue = chroma < 1e-6 ? 0 : (Math.atan2(bAxis, a) * 180) / Math.PI

  return { l: lightness, c: chroma, h: (hue + 360) % 360, alpha: color.alpha }
}

/** Allow a little over half an 8-bit step when checking RGB gamut bounds. */
const inGamut = (color: Oklch, gamut: Gamut) => {
  const { r, g, b } = toChannels(color, gamut)
  return [r, g, b].every(channel => channel >= -0.002 && channel <= 1.002)
}

/** Find the highest fitting chroma without moving lightness or hue. */
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

export function formatOklch(color: Oklch): string {
  const round = (value: number, places: number) => {
    const factor = 10 ** places
    return Math.round(value * factor) / factor
  }
  const base = `${round(color.l, 3)} ${round(color.c, 3)} ${round(color.h, 1)}`
  const alpha = color.alpha === undefined ? 1 : round(clamp01(color.alpha), 3)
  return alpha >= 1 ? `oklch(${base})` : `oklch(${base} / ${alpha})`
}

export function formatRgb(color: Rgb): string {
  const r = Math.round(clamp01(color.r) * 255)
  const g = Math.round(clamp01(color.g) * 255)
  const b = Math.round(clamp01(color.b) * 255)
  /* Round alpha before testing opacity so near-opaque values serialize as HEX. */
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
