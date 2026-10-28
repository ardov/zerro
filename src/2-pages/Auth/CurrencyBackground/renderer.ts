import type { ColorScheme } from '@/6-shared/ui/theme/colors'
import { symbols, words } from './symbols'

// Selected in the currency-field prototype. All dimensions are CSS pixels.
const size = 16
const cellWidth = 20
const rowHeight = 30
const angle = (29 * Math.PI) / 180
const brightnessLight = 16
const brightnessDark = 10
const speed = -3.5
const speedSpread = 1.5
const glitchRate = 12
const glitchDuration = 0.4
const pool = [...new Set(Object.values(symbols).flat())]
const font = `${size}px "Zerro Currency Glyphs", "Zerro Currency Extras"`
const pick = <T>(values: readonly T[]): T =>
  values[Math.floor(Math.random() * values.length)]
const modulo = (value: number, length: number) =>
  ((value % length) + length) % length

function shuffledWords() {
  const result = [...words]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

type Cell = { letter: string; glyph: string }
type Row = {
  cells: Cell[]
  strip: HTMLCanvasElement
  context: CanvasRenderingContext2D
  width: number
  offset: number
  speed: number
  opacity: number
}
type Glitch = { row: Row; index: number; end: number; final: string }

/** Caches full row strips: each frame composites rows, only glitches repaint glyphs. */
export function startCurrencyBackground(
  canvas: HTMLCanvasElement,
  mode: ColorScheme
) {
  const context = canvas.getContext('2d')
  if (!context) return
  const ctx = context
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  let disposed = false
  let loaded = false
  let frame = 0
  let last = 0
  let time = 0
  let nextGlitch = 1
  let width = 0
  let height = 0
  let span = 0
  let ratio = 1
  let rows: Row[] = []
  let glitches: Glitch[] = []
  let edgeFades: CanvasGradient[] = []

  function paintCell(row: Row, index: number, glyph: string, flash = false) {
    const g = row.context
    g.clearRect(index * cellWidth, 0, cellWidth, rowHeight)
    const brightness = mode === 'dark' ? brightnessDark : brightnessLight
    const contrast = flash ? brightness * 2.2 : brightness
    const value = mode === 'dark' ? 255 : 0
    g.fillStyle = `rgb(${value} ${value} ${value} / ${contrast / 255})`
    g.fillText(glyph, (index + 0.5) * cellWidth, rowHeight / 2)
  }

  function resize() {
    if (disposed) return
    const bounds = canvas.getBoundingClientRect()
    width = bounds.width
    height = bounds.height
    if (!width || !height) return
    ratio = Math.min(devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    span = Math.hypot(width, height) + rowHeight * 4
    glitches = []
    rows = []
    if (!loaded) {
      draw()
      return
    }
    for (let y = 0; y < span; y += rowHeight) {
      const cells: Cell[] = []
      while (cells.length * cellWidth < span + cellWidth * 2) {
        for (const word of shuffledWords()) {
          for (const letter of word)
            cells.push({ letter, glyph: pick(symbols[letter]) })
        }
      }
      const strip = document.createElement('canvas')
      const stripWidth = cells.length * cellWidth
      strip.width = Math.ceil(stripWidth * ratio)
      strip.height = Math.ceil(rowHeight * ratio)
      const g = strip.getContext('2d')
      if (!g) continue
      g.scale(ratio, ratio)
      g.font = font
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      const row: Row = {
        cells,
        strip,
        context: g,
        width: stripWidth,
        offset: Math.random() * stripWidth,
        speed: speed * (1 + (Math.random() * 2 - 1) * speedSpread),
        opacity: 1 - Math.random() * 0.3,
      }
      cells.forEach((cell, index) => paintCell(row, index, cell.glyph))
      rows.push(row)
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    // A rectangular mask reaches full transparency on every edge, including
    // the middle of the long sides. Keep the same fade distance on both axes.
    const fade = Math.min(320, Math.min(width, height) * 0.4)
    edgeFades = [
      ctx.createLinearGradient(0, 0, width, 0),
      ctx.createLinearGradient(0, 0, 0, height),
    ]
    edgeFades.forEach((gradient, index) => {
      const stop = fade / (index === 0 ? width : height)
      gradient.addColorStop(0, '#000')
      gradient.addColorStop(stop, '#0000')
      gradient.addColorStop(1 - stop, '#0000')
      gradient.addColorStop(1, '#000')
    })
    draw()
  }

  function draw() {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.globalAlpha = 1
    ctx.clearRect(0, 0, width, height)
    ctx.save()
    ctx.translate(width / 2, height / 2)
    ctx.rotate(angle)
    rows.forEach((row, i) => {
      ctx.globalAlpha = row.opacity
      const x = -span / 2 - row.offset
      const y = i * rowHeight - span / 2 - rowHeight / 2
      ctx.drawImage(row.strip, x, y, row.width, rowHeight)
      ctx.drawImage(row.strip, x + row.width, y, row.width, rowHeight)
    })
    ctx.restore()
    ctx.globalAlpha = 1
    // Erase the artwork, revealing the theme's canvas color beneath it.
    ctx.globalCompositeOperation = 'destination-out'
    edgeFades.forEach(gradient => {
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
    })
    ctx.globalCompositeOperation = 'source-over'
  }

  function glitch() {
    const x = (Math.random() - 0.5) * width
    const y = (Math.random() - 0.5) * height
    const localX = x * Math.cos(angle) + y * Math.sin(angle)
    const localY = -x * Math.sin(angle) + y * Math.cos(angle)
    const row = rows[Math.round((localY + span / 2) / rowHeight)]
    if (!row) return
    const index = modulo(
      Math.floor((localX + span / 2 + row.offset) / cellWidth),
      row.cells.length
    )
    if (glitches.some(g => g.row === row && g.index === index)) return
    const cell = row.cells[index]
    glitches.push({
      row,
      index,
      end: time + glitchDuration,
      final: pick(symbols[cell.letter]),
    })
    paintCell(row, index, pick(pool), true)
  }

  function restoreGlitch(g: Glitch) {
    g.row.cells[g.index].glyph = g.final
    paintCell(g.row, g.index, g.final)
  }

  function running() {
    return loaded && !disposed && !document.hidden && !motion.matches
  }

  function tick(now: number) {
    frame = 0
    if (!running()) return
    const delta = last ? Math.min((now - last) / 1000, 0.05) : 0
    last = now
    time += delta
    // Decreasing the source offset moves the visible strip to the right.
    rows.forEach(row => {
      row.offset = modulo(row.offset - row.speed * delta, row.width)
    })
    glitches = glitches.filter(g => {
      if (g.end > time) return true
      restoreGlitch(g)
      return false
    })
    nextGlitch -= delta * glitchRate
    if (nextGlitch <= 0) {
      glitch()
      nextGlitch = -Math.log(Math.max(0.0001, Math.random()))
    }
    draw()
    frame = requestAnimationFrame(tick)
  }

  function syncMotion() {
    cancelAnimationFrame(frame)
    frame = 0
    last = 0
    if (motion.matches) {
      glitches.forEach(restoreGlitch)
      glitches = []
      draw()
    }
    if (running()) frame = requestAnimationFrame(tick)
  }

  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()
  document.addEventListener('visibilitychange', syncMotion)
  motion.addEventListener('change', syncMotion)
  void Promise.all([
    document.fonts.load(`${size}px "Zerro Currency Glyphs"`, pool.join('')),
    document.fonts.load(`${size}px "Zerro Currency Extras"`, pool.join('')),
  ])
    .then(() => {
      if (disposed) return
      loaded = true
      resize()
      syncMotion()
    })
    .catch(() => {
      // Keep the theme background if its decorative fonts cannot load.
    })

  return () => {
    disposed = true
    cancelAnimationFrame(frame)
    observer.disconnect()
    document.removeEventListener('visibilitychange', syncMotion)
    motion.removeEventListener('change', syncMotion)
    rows = []
    glitches = []
  }
}
