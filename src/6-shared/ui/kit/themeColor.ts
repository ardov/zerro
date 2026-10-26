// Literal sRGB equivalents of Canvas in theme.css. Update these when Canvas
// changes; public/manifest.json uses the dark color for the PWA launch screen.
const canvasColors = { light: '#f4f5f6', dark: '#111212' }

export function getThemeColor(mode: 'light' | 'dark') {
  return canvasColors[mode]
}
