import type { ColorScheme } from '@/6-shared/ui/theme/colors'
import { symbols, words } from './symbols'
import type { GlyphSeed } from './physics'
import {
  advanceSpring,
  clickImpulse,
  defaultCurrencySettings,
} from './interaction'
import type { CurrencySettings, Point, SpringState } from './interaction'

// Selected in the currency-field prototype. All dimensions are CSS pixels.
const size = 16
const cellWidth = 20
const rowHeight = 30
const angle = (29 * Math.PI) / 180
const cosAngle = Math.cos(angle)
const sinAngle = Math.sin(angle)
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
type GlyphArtwork = {
  index: number
  offsetX: number
  offsetY: number
  width: number
  height: number
}
type GlyphSprite = {
  artwork: GlyphArtwork
  opacity: number
  edgeOpacity: number
}
type Pile = ReturnType<(typeof import('./physics'))['createGlyphPile']>
type Nudge = SpringState & { row: Row; rowIndex: number; index: number }

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
  let clicks = 0
  let phase: 'flowing' | 'loading' | 'falling' | 'settled' = 'flowing'
  let pile: Pile | undefined
  let sprites: GlyphSprite[] = []
  let glyphAtlas: HTMLCanvasElement | undefined
  let atlasRatio = 1
  let settings = { ...defaultCurrencySettings }
  const nudges = new Map<Cell, Nudge>()
  let generation = 0
  const host = canvas.parentElement

  function setPhase(next: typeof phase) {
    phase = next
    canvas.dataset.currencyState = next
  }
  setPhase('flowing')

  function paintCell(row: Row, index: number, glyph: string, flash = false) {
    const g = row.context
    g.clearRect(index * cellWidth, 0, cellWidth, rowHeight)
    const brightness = mode === 'dark' ? brightnessDark : brightnessLight
    const contrast = flash ? brightness * 2.2 : brightness
    const value = mode === 'dark' ? 255 : 0
    g.fillStyle = `rgb(${value} ${value} ${value} / ${contrast / 255})`
    g.fillText(glyph, (index + 0.5) * cellWidth, rowHeight / 2)
  }

  function releaseRows() {
    rows.forEach(row => {
      row.strip.width = row.strip.height = 0
    })
    rows = []
    nudges.clear()
  }

  function releaseAtlas() {
    if (glyphAtlas) glyphAtlas.width = glyphAtlas.height = 0
    glyphAtlas = undefined
  }

  function buildGlyphAtlas() {
    releaseAtlas()
    const atlas = document.createElement('canvas')
    atlas.width = Math.ceil(pool.length * cellWidth * ratio)
    atlas.height = Math.ceil(rowHeight * ratio)
    const g = atlas.getContext('2d')
    if (!g) throw new Error('Currency atlas context unavailable')
    g.scale(ratio, ratio)
    g.font = font
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    const brightness = mode === 'dark' ? brightnessDark : brightnessLight
    const value = mode === 'dark' ? 255 : 0
    g.fillStyle = `rgb(${value} ${value} ${value} / ${brightness / 255})`
    const artwork = new Map<string, GlyphArtwork>()
    pool.forEach((glyph, index) => {
      const metrics = g.measureText(glyph)
      g.fillText(glyph, (index + 0.5) * cellWidth, rowHeight / 2)
      artwork.set(glyph, {
        index,
        offsetX:
          (metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft) / 2,
        offsetY:
          (metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent) /
          2,
        width: Math.max(
          2,
          metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight + 1
        ),
        height: Math.max(
          2,
          metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 1
        ),
      })
    })
    glyphAtlas = atlas
    atlasRatio = ratio
    return artwork
  }

  function resize(force = false) {
    if (disposed) return
    const bounds = canvas.getBoundingClientRect()
    const nextRatio = Math.min(devicePixelRatio || 1, 2)
    if (
      !force &&
      bounds.width === width &&
      bounds.height === height &&
      nextRatio === ratio &&
      (rows.length || pile)
    )
      return
    width = bounds.width
    height = bounds.height
    if (!width || !height) return
    ratio = nextRatio
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    if (pile) {
      pile.resize(width, height)
      setPhase('falling')
      draw(true)
      syncMotion()
      return
    }
    span = Math.hypot(width, height) + rowHeight * 4
    releaseRows()
    glitches = []
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

  function cellPosition(row: Row, rowIndex: number, index: number): Point {
    const x =
      -span / 2 + modulo((index + 0.5) * cellWidth - row.offset, row.width)
    const y = rowIndex * rowHeight - span / 2
    return {
      x: width / 2 + x * cosAngle - y * sinAngle,
      y: height / 2 + x * sinAngle + y * cosAngle,
    }
  }

  function repulseRows(cursor: Point) {
    if (!settings.rowImpulse) return
    function apply(row: Row, rowIndex: number, index: number) {
      const cell = row.cells[index]
      const position = cellPosition(row, rowIndex, index)
      const current = nudges.get(cell)
      const impulse = clickImpulse(
        {
          x: position.x + (current?.x ?? 0),
          y: position.y + (current?.y ?? 0),
        },
        cursor,
        settings.radius,
        settings.rowImpulse
      )
      if (!impulse.x && !impulse.y) return
      const nudge = current ?? {
        row,
        rowIndex,
        index,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
      }
      nudge.vx += impulse.x
      nudge.vy += impulse.y
      const speed = Math.hypot(nudge.vx, nudge.vy)
      const limit = settings.rowImpulse * 2
      if (speed > limit) {
        nudge.vx *= limit / speed
        nudge.vy *= limit / speed
      }
      nudges.set(cell, nudge)
    }
    // Existing displacements can carry a glyph beyond its anchor's search band.
    const existing = new Set(nudges.keys())
    nudges.forEach(nudge => apply(nudge.row, nudge.rowIndex, nudge.index))
    const x =
      (cursor.x - width / 2) * cosAngle + (cursor.y - height / 2) * sinAngle
    const y =
      -(cursor.x - width / 2) * sinAngle + (cursor.y - height / 2) * cosAngle
    const firstRow = Math.max(
      0,
      Math.ceil((y - settings.radius + span / 2) / rowHeight)
    )
    const lastRow = Math.min(
      rows.length - 1,
      Math.floor((y + settings.radius + span / 2) / rowHeight)
    )
    for (let rowIndex = firstRow; rowIndex <= lastRow; rowIndex++) {
      const row = rows[rowIndex]
      const firstCell = Math.ceil(
        (x - settings.radius + span / 2 + row.offset) / cellWidth - 0.5
      )
      const lastCell = Math.floor(
        (x + settings.radius + span / 2 + row.offset) / cellWidth - 0.5
      )
      for (let candidate = firstCell; candidate <= lastCell; candidate++) {
        const index = modulo(candidate, row.cells.length)
        const cell = row.cells[index]
        if (existing.has(cell)) continue
        existing.add(cell)
        apply(row, rowIndex, index)
      }
    }
  }

  function drawNudges() {
    // Punch out the original cells, then draw displaced glyphs above every hole.
    ctx.globalCompositeOperation = 'destination-out'
    ctx.globalAlpha = 1
    ctx.fillStyle = '#000'
    nudges.forEach(nudge => {
      const position = cellPosition(nudge.row, nudge.rowIndex, nudge.index)
      ctx.save()
      ctx.translate(position.x, position.y)
      ctx.rotate(angle)
      ctx.fillRect(-cellWidth / 2, -rowHeight / 2, cellWidth, rowHeight)
      ctx.restore()
    })
    ctx.globalCompositeOperation = 'source-over'
    nudges.forEach(nudge => {
      const position = cellPosition(nudge.row, nudge.rowIndex, nudge.index)
      ctx.save()
      ctx.globalAlpha = nudge.row.opacity
      ctx.translate(position.x + nudge.x, position.y + nudge.y)
      ctx.rotate(angle)
      ctx.drawImage(
        nudge.row.strip,
        nudge.index * cellWidth * ratio,
        0,
        cellWidth * ratio,
        rowHeight * ratio,
        -cellWidth / 2,
        -rowHeight / 2,
        cellWidth,
        rowHeight
      )
      ctx.restore()
    })
  }

  function draw(includeUnsettled = false) {
    // Under reduced motion, compute the final pile without displaying travel.
    if (pile && motion.matches && phase === 'falling' && !includeUnsettled)
      return
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.globalAlpha = 1
    ctx.clearRect(0, 0, width, height)
    const atlas = glyphAtlas
    if (pile && atlas) {
      const { bodies, elapsed, releaseDelays, retired } = pile
      bodies.forEach((body, i) => {
        if (
          retired.has(body) ||
          body.bounds.max.x < 0 ||
          body.bounds.min.x > width ||
          body.bounds.max.y < 0 ||
          body.bounds.min.y > height
        )
          return
        const sprite = sprites[i]
        const artwork = sprite.artwork
        const releasedFor = elapsed - releaseDelays[i]
        const reveal =
          phase === 'settled' ? 1 : Math.max(0, Math.min(1, releasedFor / 600))
        ctx.globalAlpha =
          sprite.opacity *
          (sprite.edgeOpacity + (1 - sprite.edgeOpacity) * reveal)
        const cos = Math.cos(body.angle) * ratio
        const sin = Math.sin(body.angle) * ratio
        ctx.setTransform(
          cos,
          sin,
          -sin,
          cos,
          body.position.x * ratio,
          body.position.y * ratio
        )
        ctx.drawImage(
          atlas,
          artwork.index * cellWidth * atlasRatio,
          0,
          cellWidth * atlasRatio,
          rowHeight * atlasRatio,
          -cellWidth / 2 - artwork.offsetX,
          -rowHeight / 2 - artwork.offsetY,
          cellWidth,
          rowHeight
        )
      })
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    } else {
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
      if (nudges.size) drawNudges()
    }
    // Erase the artwork, revealing the theme's canvas color beneath it.
    if (!pile) {
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'destination-out'
      edgeFades.forEach(gradient => {
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
      })
      ctx.globalCompositeOperation = 'source-over'
    }
    ctx.globalAlpha = 1
  }

  function handlePointerDown(event: PointerEvent) {
    const target = event.target
    if (
      !loaded ||
      event.defaultPrevented ||
      event.button !== 0 ||
      !(target instanceof Element) ||
      target.closest(
        'button, a, input, select, textarea, label, [role="button"], [contenteditable], svg, p, h1, h2, h3'
      )
    )
      return
    const bounds = canvas.getBoundingClientRect()
    const cursor = {
      x: ((event.clientX - bounds.left) * width) / bounds.width,
      y: ((event.clientY - bounds.top) * height) / bounds.height,
    }
    if (pile) {
      if (!motion.matches && pile.repulse(cursor)) {
        setPhase('falling')
        syncMotion()
      }
      return
    }
    if (phase !== 'flowing') return
    if (!motion.matches) repulseRows(cursor)
    if (
      settings.collapseAfterClicks > 0 &&
      ++clicks >= settings.collapseAfterClicks
    )
      void collapse()
  }

  async function collapse() {
    if (!loaded || phase !== 'flowing') return
    const run = ++generation
    glitches.forEach(restoreGlitch)
    glitches = []
    setPhase('loading')
    draw()
    syncMotion()
    try {
      // Keep the optional physics code out of the initial render path.
      const { createGlyphPile } = await import('./physics')
      if (disposed || run !== generation) return
      const seeds: GlyphSeed[] = []
      const artwork = buildGlyphAtlas()
      const fade = Math.min(320, Math.min(width, height) * 0.4)
      sprites = []
      rows.forEach((row, rowIndex) => {
        row.cells.forEach((cell, index) => {
          const nudge = nudges.get(cell)
          const art = artwork.get(cell.glyph)!
          const localY = rowIndex * rowHeight - span / 2 + art.offsetY
          for (let repeat = 0; repeat < 2; repeat++) {
            const localX =
              -span / 2 -
              row.offset +
              (index + 0.5) * cellWidth +
              repeat * row.width +
              art.offsetX
            const x =
              width / 2 +
              localX * cosAngle -
              localY * sinAngle +
              (nudge?.x ?? 0)
            const y =
              height / 2 +
              localX * sinAngle +
              localY * cosAngle +
              (nudge?.y ?? 0)
            if (x < 0 || x > width || y < 0 || y > height) continue
            seeds.push({
              x,
              y,
              width: art.width,
              height: art.height,
              angle,
              velocityX: row.speed * cosAngle + (nudge?.vx ?? 0),
              velocityY: row.speed * sinAngle + (nudge?.vy ?? 0),
            })
            sprites.push({
              artwork: art,
              opacity: row.opacity,
              // Still-attached regions retain the field's original edge fade.
              edgeOpacity:
                Math.min(1, Math.min(x, width - x) / fade) *
                Math.min(1, Math.min(y, height - y) / fade),
            })
          }
        })
      })
      pile = createGlyphPile(seeds, width, height, settings)
      releaseRows()
      setPhase('falling')
      syncMotion()
    } catch {
      // A failed optional chunk must not interrupt sign-in or the artwork.
      if (disposed || run !== generation) return
      clicks = 0
      setPhase('flowing')
      syncMotion()
    }
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
    return (
      loaded &&
      !disposed &&
      !document.hidden &&
      (phase === 'falling' || (phase === 'flowing' && !motion.matches))
    )
  }

  function tick(now: number) {
    frame = 0
    if (!running()) return
    const delta = last ? Math.min((now - last) / 1000, 0.05) : 0
    last = now
    if (pile) {
      let settled: boolean
      if (motion.matches) {
        // Yield between batches so the login controls stay responsive.
        const deadline = performance.now() + 8
        do {
          settled = pile.advance(1000 / 60)
        } while (!settled && performance.now() < deadline)
      } else {
        settled = pile.advance(delta * 1000)
      }
      if (settled) setPhase('settled')
      draw()
      if (running()) frame = requestAnimationFrame(tick)
      return
    }
    time += delta
    nudges.forEach((nudge, cell) => {
      if (advanceSpring(nudge, delta, settings)) nudges.delete(cell)
    })
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
      nudges.clear()
      glitches.forEach(restoreGlitch)
      glitches = []
      draw()
    }
    if (running()) frame = requestAnimationFrame(tick)
  }

  const observer = new ResizeObserver(() => resize())
  observer.observe(canvas)
  resize()
  document.addEventListener('visibilitychange', syncMotion)
  motion.addEventListener('change', syncMotion)
  host?.addEventListener('pointerdown', handlePointerDown)
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

  function dispose() {
    disposed = true
    cancelAnimationFrame(frame)
    observer.disconnect()
    document.removeEventListener('visibilitychange', syncMotion)
    motion.removeEventListener('change', syncMotion)
    host?.removeEventListener('pointerdown', handlePointerDown)
    pile?.dispose()
    sprites = []
    delete canvas.dataset.currencyState
    releaseRows()
    releaseAtlas()
    glitches = []
    nudges.clear()
  }

  return {
    dispose,
    collapse,
    configure(next: Partial<CurrencySettings>) {
      settings = { ...settings, ...next }
      pile?.configure(settings)
    },
    reset() {
      generation++
      pile?.dispose()
      pile = undefined
      sprites = []
      releaseAtlas()
      clicks = 0
      time = 0
      nextGlitch = 1
      setPhase('flowing')
      resize(true)
      syncMotion()
    },
  }
}
