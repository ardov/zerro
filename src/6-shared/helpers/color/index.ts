/** The colour module's public surface: a scale, and the conversions dynamic
 * colour code needs to read and rewrite a value it did not author. Everything
 * else — channel conversions, gamut checks, the sRGB formatter — stays behind
 * `ColorScale`. Dynamic foregrounds use the same APCA algorithm. */
export { ColorScale } from './ColorScale'
export { clampChroma, formatOklch, oklchToRgb, parseColor } from './oklch'

export { getContrastText } from './contrast'
export { parseColorInput } from './input'
