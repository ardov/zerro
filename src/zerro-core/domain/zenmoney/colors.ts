// ZenMoney stores entity colors as 24-bit RGB integers. This module owns the
// codec plus the Zerro convention for tags without an explicit color: a
// deterministic color generated from the tag title.

export type TRgb = [number, number, number]

export function int2hex(int: number | null): string | null {
  if (typeof int !== 'number') return null
  const r = ((int >> 16) & 0xff).toString(16).padStart(2, '0')
  const g = ((int >> 8) & 0xff).toString(16).padStart(2, '0')
  const b = (int & 0xff).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

export function hex2int(hex?: string | null): number | null {
  if (!isHEX(hex)) return null
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return rgbToInt(r, g, b)
}

export function hex2rgb(hex?: string | null): TRgb | null {
  if (!isHEX(hex)) return null
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

export function isHEX(hex: unknown): hex is string {
  if (typeof hex === 'string') return /^#[0-9A-F]{6}$/i.test(hex)
  return false
}

const rgbToInt = (r: number, g: number, b: number) => (r << 16) + (g << 8) + b

/**
 * Deterministic color for a tag without an explicit color, generated from the
 * tag title. The palette is a frozen snapshot of the app palette (Material
 * shades 100-900 + A100 minus theme backgrounds); it must stay stable so tag
 * colors do not change between releases and clients.
 */
export function getColorForString(str: string): string {
  const seed = hashCode(str)
  let int = getIntFromSeed(seed)
  if (int < 0) int = -int
  const idx = int % GENERATED_COLOR_PALETTE.length
  return GENERATED_COLOR_PALETTE[idx]
}

function hashCode(str: string) {
  return str
    .toString()
    .split('')
    .reduce((hash, s) => ((hash << 5) - hash + s.charCodeAt(0)) | 0, 0)
}

const getIntFromSeed = (seed: number) => (seed * 9301 + 49297) % 233280

// prettier-ignore
const GENERATED_COLOR_PALETTE: string[] = [
  '#ffcdd2', '#ef9a9a', '#e57373', '#ef5350', '#f44336', '#e53935',
  '#d32f2f', '#c62828', '#b71c1c', '#ff8a80', '#f8bbd0', '#f48fb1',
  '#f06292', '#ec407a', '#e91e63', '#d81b60', '#c2185b', '#ad1457',
  '#880e4f', '#ff80ab', '#e1bee7', '#ce93d8', '#ba68c8', '#ab47bc',
  '#9c27b0', '#8e24aa', '#7b1fa2', '#6a1b9a', '#4a148c', '#ea80fc',
  '#d1c4e9', '#b39ddb', '#9575cd', '#7e57c2', '#673ab7', '#5e35b1',
  '#512da8', '#4527a0', '#311b92', '#b388ff', '#c5cae9', '#9fa8da',
  '#7986cb', '#5c6bc0', '#3f51b5', '#3949ab', '#303f9f', '#283593',
  '#1a237e', '#8c9eff', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5',
  '#2196f3', '#1e88e5', '#1976d2', '#1565c0', '#0d47a1', '#82b1ff',
  '#b3e5fc', '#81d4fa', '#4fc3f7', '#29b6f6', '#03a9f4', '#039be5',
  '#0288d1', '#0277bd', '#01579b', '#80d8ff', '#b2ebf2', '#80deea',
  '#4dd0e1', '#26c6da', '#00bcd4', '#00acc1', '#0097a7', '#00838f',
  '#006064', '#84ffff', '#b2dfdb', '#80cbc4', '#4db6ac', '#26a69a',
  '#009688', '#00897b', '#00796b', '#00695c', '#004d40', '#a7ffeb',
  '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#43a047',
  '#388e3c', '#2e7d32', '#1b5e20', '#b9f6ca', '#dcedc8', '#c5e1a5',
  '#aed581', '#9ccc65', '#8bc34a', '#7cb342', '#689f38', '#558b2f',
  '#33691e', '#ccff90', '#f0f4c3', '#e6ee9c', '#dce775', '#d4e157',
  '#cddc39', '#c0ca33', '#afb42b', '#9e9d24', '#827717', '#f4ff81',
  '#fff9c4', '#fff59d', '#fff176', '#ffee58', '#ffeb3b', '#fdd835',
  '#fbc02d', '#f9a825', '#f57f17', '#ffff8d', '#ffecb3', '#ffe082',
  '#ffd54f', '#ffca28', '#ffc107', '#ffb300', '#ffa000', '#ff8f00',
  '#ff6f00', '#ffe57f', '#ffe0b2', '#ffcc80', '#ffb74d', '#ffa726',
  '#ff9800', '#fb8c00', '#f57c00', '#ef6c00', '#e65100', '#ffd180',
  '#ffccbc', '#ffab91', '#ff8a65', '#ff7043', '#ff5722', '#f4511e',
  '#e64a19', '#d84315', '#bf360c', '#ff9e80', '#d7ccc8', '#bcaaa4',
  '#a1887f', '#8d6e63', '#795548', '#6d4c41', '#5d4037', '#4e342e',
  '#3e2723', '#d7ccc8', '#eeeeee', '#e0e0e0', '#bdbdbd', '#9e9e9e',
  '#757575', '#616161', '#424242', '#cfd8dc', '#b0bec5', '#90a4ae',
  '#78909c', '#607d8b', '#546e7a', '#455a64', '#37474f', '#263238',
  '#cfd8dc',

]
