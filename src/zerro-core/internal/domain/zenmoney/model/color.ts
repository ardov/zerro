// ZenMoney persists entity colors as 24-bit RGB integers.

export function int2hex(int: number | null): string | null {
  if (typeof int !== 'number') return null
  const r = ((int >> 16) & 0xff).toString(16).padStart(2, '0')
  const g = ((int >> 8) & 0xff).toString(16).padStart(2, '0')
  const b = (int & 0xff).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

export function hex2int(hex?: string | null): number | null {
  if (!isHEX(hex)) return null
  return rgbToInt(
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  )
}

export function isHEX(hex: unknown): hex is string {
  return typeof hex === 'string' && /^#[0-9A-F]{6}$/i.test(hex)
}

function rgbToInt(r: number, g: number, b: number): number {
  return (r << 16) + (g << 8) + b
}
