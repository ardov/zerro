import { apcaContrast } from './APCAcontrast'
import { makeColorArray } from './makeColorArray'

type RGB = [number, number, number]

const colorArray = makeColorArray({
  shades: [100, 200, 300, 400, 500, 600, 700, 800, 900, 'A100'],
})

function hashCode(str: string) {
  return str
    .toString()
    .split('')
    .reduce((hash, s) => ((hash << 5) - hash + s.charCodeAt(0)) | 0, 0)
}

const getIntFromSeed = (seed: number) => (seed * 9301 + 49297) % 233280

export const getColorForString = (str: string) => {
  const seed = hashCode(str)
  let int = getIntFromSeed(seed)
  if (int < 0) int = -int
  const idx = int % colorArray.length
  return colorArray[idx]
}

export const int2rgb = (int: number | null) => {
  if (typeof int !== 'number') return null
  let r = (int >> 16) & 0xff
  let g = (int >> 8) & 0xff
  let b = int & 0xff
  return `rgb(${r},${g},${b})`
}

export const int2hex = (int: number | null) => {
  if (typeof int !== 'number') return null
  let r = ((int >> 16) & 0xff).toString(16).padStart(2, '0')
  let g = ((int >> 8) & 0xff).toString(16).padStart(2, '0')
  let b = (int & 0xff).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

export const hex2int = (hex?: string | null) => {
  if (!isHEX(hex)) return null
  let r = parseInt(hex.slice(1, 3), 16)
  let g = parseInt(hex.slice(3, 5), 16)
  let b = parseInt(hex.slice(5, 7), 16)
  return rgbToInt(r, g, b)
}

const rgbToInt = (r: number, g: number, b: number) => (r << 16) + (g << 8) + b

export const isHEX = (hex: any): hex is string => {
  if (typeof hex === 'string') return /^#[0-9A-F]{6}$/i.test(hex)
  return false
}

export const hex2rgb = (hex?: string | null): RGB | null => {
  if (!isHEX(hex)) {
    console.warn('Error parsing hex: ' + hex)
    return null
  }
  let r = parseInt(hex.slice(1, 3), 16)
  let g = parseInt(hex.slice(3, 5), 16)
  let b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

const getContrastRatio = (bg: string, text: string) => {
  const bgRGB = hex2rgb(bg)
  const textRGB = hex2rgb(text)
  if (!bgRGB || !textRGB) return 0
  return Math.abs(apcaContrast(bgRGB, textRGB))
}

export const getMostContrast = (
  color: string,
  colorList: string[] = ['#ffffff', '#000000']
): string => {
  const contrastRatios = colorList.map(c => getContrastRatio(color, c))
  const maxContrast = Math.max(...contrastRatios)
  const i = contrastRatios.indexOf(maxContrast)
  return colorList[i]
}

// const getOpacity = (opacity: number) => Math.floor(opacity * 256).toString(16)
