import { converter } from 'culori'
import { apcaContrast } from './APCAcontrast'

const rgb = converter('rgb')

/** Pick the stronger APCA polarity for an opaque fill. Alpha is ignored. */
export function getContrastText(background: string): string {
  const color = rgb(background)
  if (!color) return '#ffffff'
  const channels = [color.r, color.g, color.b]
  if (!channels.every(Number.isFinite)) return '#ffffff'
  const [r, g, b] = channels.map(value => Math.min(1, Math.max(0, value)) * 255)
  const white = Math.abs(apcaContrast([r, g, b], [255, 255, 255]))
  const black = Math.abs(apcaContrast([r, g, b], [0, 0, 0]))
  return white >= black ? '#ffffff' : '#000000'
}
