import { formatHex } from 'culori'

/** Short HEX beats named CSS colors; discard alpha. Null clears the value, and undefined leaves it unchanged. */
export function parseColorInput(input: string): string | null | undefined {
  let text = input.trim()
  if (!text || text === '#') return null
  const digits = text.replace(/^#/, '')
  if (/^[\da-f]{1,8}$/i.test(digits)) {
    if (digits.length <= 2) text = `#${digits.repeat(6 / digits.length)}`
    else if (digits.length === 5) text = `#${digits}0`
    else text = `#${digits}`
  }
  const hex = formatHex(text)
  return hex && /^#[\da-f]{6}$/i.test(hex) ? hex : undefined
}

export function isSameColor(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  return a?.toLowerCase() === b?.toLowerCase()
}
