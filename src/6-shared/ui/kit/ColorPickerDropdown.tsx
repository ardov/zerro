import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { converter, formatHex } from 'culori'
import { useTranslation } from 'react-i18next'
import {
  getContrastText,
  isSameColor,
  parseColorInput,
} from '@/6-shared/helpers/color'
import { Popover } from './Popover'
import './ColorPickerDropdown.css'

const toOkhsv = converter('okhsv')
const toRgb = converter('rgb')
type Coordinates = { h: number; s: number; v: number }
const clamp = (n: number) => Math.max(0, Math.min(1, n))
const hex = (color: Coordinates) => formatHex({ mode: 'okhsv', ...color })

// Thumb centre insets: radius + outline - overhang. The plane thumb overhangs
// the popup by at most 8px; the hue thumb ends 2px past the 8px padding.
const planeInset = 24 + 2 - 8
const hueInset = 20 + 2 - 10

function axisValue(offset: number, length: number, inset: number) {
  return clamp((offset - inset) / Math.max(1, length - 2 * inset))
}

function markerPosition(value: number, inset: number) {
  return `calc(${inset}px + ${value} * (100% - ${2 * inset}px))`
}

function wrapHue(h: number) {
  return ((h % 360) + 360) % 360
}

function dragHandlers(update: (event: PointerEvent<HTMLDivElement>) => void) {
  return {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      if (!event.isPrimary || event.button !== 0) return
      event.currentTarget.setPointerCapture(event.pointerId)
      update(event)
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) update(event)
    },
  }
}

function coordinates(value: string | null, fallbackHue = 0): Coordinates {
  const color = toOkhsv(value || '#ffffff')!
  return {
    h: color.h ?? fallbackHue,
    s: clamp(color.s),
    v: clamp(color.v),
  }
}

const planeSteps: Record<string, { s: number; v: number }> = {
  ArrowLeft: { s: -1, v: 0 },
  ArrowRight: { s: 1, v: 0 },
  ArrowDown: { s: 0, v: -1 },
  ArrowUp: { s: 0, v: 1 },
}

const spectrum =
  'linear-gradient(to right, ' +
  Array.from(
    { length: 37 },
    (_, i) =>
      `${hex({ h: i * 10, s: 0.75, v: 1 })} ${markerPosition(i / 36, hueInset)}`
  ).join(', ') +
  ')'

type PickerProps = {
  icon?: ReactNode
  value: string | null
  onChange: (value: string | null) => void
}

export type ColorPickerDropdownProps = PickerProps & {
  trigger: ReactElement
  onClose?: () => void
}

export function ColorPickerDropdown(props: ColorPickerDropdownProps) {
  const { trigger, onClose, ...restProps } = props
  const { t } = useTranslation('colorPicker')
  return (
    <Popover
      trigger={trigger}
      onClose={onClose}
      mobile="popover"
      label={t('custom')}
      contentScrolls
      collisionAvoidance={{ side: 'shift', align: 'shift' }}
      // The plane is square: its width yields to the hue slider and the
      // input (7rem) when the available height is short.
      className="color-picker w-[min(17.5rem,calc(var(--available-height)-7rem))] overflow-visible bg-(--color-picker-surface) text-(--color-picker-text)"
      contentClassName="p-0"
    >
      <PickerControls {...restProps} />
    </Popover>
  )
}

function PickerControls(props: PickerProps) {
  const { value, onChange, icon } = props
  const { t } = useTranslation('colorPicker')
  const [color, setColor] = useState(() => coordinates(value))
  const [draft, setDraft] = useState(value ?? '')
  // Preserve the user's coordinates at black and grey, where HEX loses hue.
  const [lastHex, setLastHex] = useState(value)
  if (!isSameColor(value, lastHex)) {
    setLastHex(value)
    setColor(coordinates(value, color.h))
    setDraft(value ?? '')
  }
  const canvas = useRef<HTMLCanvasElement>(null)
  const { h, s, v } = color
  const fill = hex(color)
  const hueFill = hex({ h, s: 0.75, v: 1 })
  useEffect(() => {
    const element = canvas.current!
    const ctx = element.getContext('2d')!
    // Sample the OKHSV plane; the browser interpolates the smooth surface.
    const draw = () => {
      const { width, height } = element
      const displayWidth = element.clientWidth
      const displayHeight = element.clientHeight
      const pixels = ctx.createImageData(width, height)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const rgb = toRgb({
            mode: 'okhsv',
            h,
            s: axisValue(
              (x / (width - 1)) * displayWidth,
              displayWidth,
              planeInset
            ),
            v:
              1 -
              axisValue(
                (y / (height - 1)) * displayHeight,
                displayHeight,
                planeInset
              ),
          })
          const i = (y * width + x) * 4
          pixels.data[i] = rgb.r * 255
          pixels.data[i + 1] = rgb.g * 255
          pixels.data[i + 2] = rgb.b * 255
          pixels.data[i + 3] = 255
        }
      }
      ctx.putImageData(pixels, 0, 0)
    }
    const observer = new ResizeObserver(draw)
    observer.observe(element)
    return () => observer.disconnect()
  }, [h])

  function emit(next: string | null) {
    setLastHex(next)
    if (!isSameColor(next, value)) onChange(next)
  }
  function select(next: Coordinates) {
    setColor(next)
    const result = hex(next)
    setDraft(result)
    emit(result)
  }
  function point(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    select({
      h,
      s: axisValue(event.clientX - box.left, box.width, planeInset),
      v: 1 - axisValue(event.clientY - box.top, box.height, planeInset),
    })
  }
  return (
    <div className="rounded-ui-popover rounded-smooth">
      <div
        className="color-picker-plane relative aspect-square outline-none touch-none cursor-crosshair"
        role="slider"
        aria-label={t('plane')}
        aria-valuenow={Math.round(s * 100)}
        aria-valuetext={t('coordinates', {
          s: Math.round(s * 100),
          v: Math.round(v * 100),
        })}
        tabIndex={0}
        onKeyDown={e => {
          const move = planeSteps[e.key]
          if (!move || e.altKey || e.ctrlKey || e.metaKey) return
          e.preventDefault()
          const step = e.shiftKey ? 0.1 : 0.01
          select({
            h,
            s: clamp(s + move.s * step),
            v: clamp(v + move.v * step),
          })
        }}
        {...dragHandlers(point)}
      >
        <canvas
          aria-hidden
          ref={canvas}
          width={96}
          height={96}
          className="absolute inset-0 size-full rounded-t-ui-popover rounded-smooth"
        />
        <span
          aria-hidden
          className="color-picker-thumb pointer-events-none absolute z-1 flex size-12 -translate-1/2 items-center justify-center rounded-full"
          style={{
            left: markerPosition(s, planeInset),
            top: markerPosition(1 - v, planeInset),
            backgroundColor: fill,
            color: getContrastText(fill),
          }}
        >
          {icon}
        </span>
      </div>
      <div className="grid gap-2 p-2">
        <div
          role="slider"
          tabIndex={0}
          aria-label={t('hue')}
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(h)}
          className="relative h-10 rounded-[calc(var(--radius-ui-popover)-0.5rem)] rounded-smooth focusable touch-none cursor-pointer"
          style={{ backgroundImage: spectrum }}
          {...dragHandlers(event => {
            const box = event.currentTarget.getBoundingClientRect()
            const offset = event.clientX - box.left
            // Hue is circular: dragging past either end keeps turning it.
            const hue =
              offset >= 0 && offset <= box.width
                ? 360 * axisValue(offset, box.width, hueInset)
                : wrapHue((360 * offset) / box.width)
            select({ ...color, h: hue })
          })}
          onKeyDown={event => {
            if (event.altKey || event.ctrlKey || event.metaKey) return
            const step = event.shiftKey ? 10 : 1
            let hue: number
            switch (event.key) {
              case 'Home':
                hue = 0
                break
              case 'End':
                hue = 360
                break
              case 'ArrowLeft':
              case 'ArrowDown':
                hue = wrapHue(h - step)
                break
              case 'ArrowRight':
              case 'ArrowUp':
                hue = wrapHue(h + step)
                break
              default:
                return
            }
            event.preventDefault()
            select({ ...color, h: hue })
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 size-10 -translate-1/2 rounded-full outline-2 outline-(--color-picker-surface)"
            style={{
              left: markerPosition(h / 360, hueInset),
              backgroundColor: hueFill,
            }}
          />
        </div>
        <input
          type="text"
          aria-label={t('input')}
          value={draft}
          placeholder="#000000"
          spellCheck={false}
          autoComplete="off"
          className="h-12 w-full rounded-[calc(var(--radius-ui-popover)-0.5rem)] rounded-smooth bg-(--color-picker-field) px-4 text-ui-16 focusable"
          onFocus={e => e.currentTarget.select()}
          onChange={e => {
            const text = e.currentTarget.value
            setDraft(text)
            const next = parseColorInput(text)
            // A lone `#` parses as empty but still lets the user keep typing.
            if (next) {
              setColor(coordinates(next, h))
              emit(next)
            } else if (!text.trim()) emit(null)
          }}
        />
      </div>
    </div>
  )
}
