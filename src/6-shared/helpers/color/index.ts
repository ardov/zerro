import { apcaContrast } from './APCAcontrast'

type RGB = [number, number, number]

export const isHEX = (hex: any): hex is string => {
  if (typeof hex === 'string') return /^#[0-9A-F]{6}$/i.test(hex)
  return false
}

const hex2rgb = (hex?: string | null): RGB | null => {
  if (!isHEX(hex)) {
    console.warn('Error parsing hex: ' + hex)
    return null
  }
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
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
