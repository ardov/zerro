import { formatHex } from 'culori'

/** User input -> opaque sRGB HEX; null clears, undefined leaves it unchanged.
 * Short bare/# HEX takes precedence over named CSS colors. Alpha is discarded.
 * This leniency belongs at the input boundary, not in stored-color validation. */
export function parseColorInput(input: string): string | null | undefined {
  let text = input.trim()
  if (!text || text === '#') return null
  const digits = text.replace(/^#/, '')
  if (/^[\da-f]{1,8}$/i.test(digits)) {
    if (digits.length <= 2) text = `#${digits.repeat(6 / digits.length)}`
    else if (digits.length === 5) text = `#${digits}0`
    else text = `#${digits}`
  }
  // Culori handles CSS color literals and drops alpha when formatting HEX.
  const hex = formatHex(text)
  return hex && /^#[\da-f]{6}$/i.test(hex) ? hex : undefined
}
