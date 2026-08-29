/** The two colour calculations the palette is described in terms of, kept to
 * MUI's own arithmetic so the values they produce do not move.
 *
 * `alpha` is not a mix. It *replaces* a colour's alpha rather than multiplying
 * it, which is why the state fills built on `action.selected` — itself already
 * transparent — come out at the opacity they name. CSS `color-mix(… ,
 * transparent)` multiplies, and would quietly make every one of those fainter. */

type Rgb = [red: number, green: number, blue: number]

/** Accepts the notations the palette and the tag colours actually use:
 * `#rgb`, `#rrggbb`, `rgb(…)` and `rgba(…)`. */
function toRgb(color: string): Rgb {
  if (color.startsWith('#')) {
    const digits = color.slice(1)
    const full =
      digits.length < 6
        ? [...digits]
            .map(d => d + d)
            .join('')
            .slice(0, 6)
        : digits.slice(0, 6)
    const int = parseInt(full, 16)
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
  }
  const parts = color
    .slice(color.indexOf('(') + 1, color.lastIndexOf(')'))
    .split(',')
    .map(part => parseFloat(part))
  return [parts[0], parts[1], parts[2]]
}

export function alpha(color: string, value: number): string {
  const [r, g, b] = toRgb(color)
  const clamped = Math.min(1, Math.max(0, value))
  return `rgba(${r}, ${g}, ${b}, ${clamped})`
}

/** W3C relative luminance, rounded the way MUI rounds it — the third decimal
 * is what decides a colour sitting on the contrast threshold. */
export function getLuminance(color: string): number {
  const channels = toRgb(color).map(channel => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return Number(
    (
      0.2126 * channels[0] +
      0.7152 * channels[1] +
      0.0722 * channels[2]
    ).toFixed(3)
  )
}

export function getContrastRatio(foreground: string, background: string) {
  const a = getLuminance(foreground)
  const b = getLuminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** White or near-black over a background, at MUI's threshold of 3. Every
 * static pairing is already written into the palette as `contrastText`; this
 * is for the colours the app does not choose — a tag's, above all. */
export function getContrastText(background: string): string {
  return getContrastRatio(background, '#fff') >= 3
    ? '#fff'
    : 'rgba(0, 0, 0, 0.87)'
}
