import { formatHex } from 'culori'
import themeCss from './theme.css?raw'

// Browser chrome needs a literal sRGB value, not a CSS variable. Read the
// authored card colors once without forcing a DOM style recalculation while
// fields and overlays are mounting. The stylesheet remains the source of truth.
const cardColors = [...themeCss.matchAll(/--color-ui-card:\s*([^;]+);/g)].map(
  ([, value]) => formatHex(value)
)

export function getThemeColor(mode: 'light' | 'dark') {
  return cardColors[mode === 'light' ? 0 : 1]
}
