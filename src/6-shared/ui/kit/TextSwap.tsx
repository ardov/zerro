import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'
import './TextSwap.css'

type TextSwapProps<T extends string> = {
  value: T
  formatValue?: (value: T) => string
  getDirection?: (next: T, previous: T) => 'forward' | 'backward'
  /** Keep the width in step with the text instead of easing to it. For text
   * that follows something else moving, such as a scroll position. */
  instantWidth?: boolean
  className?: string
}

/** Decorative text for a control that provides its current accessible name.
 * Two bounded layers replace each other without queuing rapid changes: the
 * old text blurs away while the new one comes into focus, and the width
 * eases from one to the other. The text stays on one line. */
export function TextSwap<T extends string>({
  value,
  formatValue,
  getDirection,
  instantWidth = false,
  className,
}: TextSwapProps<T>) {
  const [{ current, outgoing }, setValues] = useState<{
    current: T
    outgoing: T | null
  }>({ current: value, outgoing: null })
  if (current !== value) setValues({ current: value, outgoing: current })
  const format = (text: T) => formatValue?.(text) ?? text

  const root = useRef<HTMLSpanElement>(null)
  /** The width on screen right now, followed through an easing in flight. */
  const shownWidth = useRef<number | null>(null)
  // Each value gets a new element, so this runs once per value.
  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    const from = shownWidth.current
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(() => {
            shownWidth.current = element.getBoundingClientRect().width
          })
    observer?.observe(element)
    // Measured in the frame that first paints the new text, not here: reading
    // layout during the commit would start the layers' animations on the spot.
    let frame = requestAnimationFrame(() => {
      const to = element.getBoundingClientRect().width
      shownWidth.current = to
      const resize =
        !instantWidth &&
        from !== null &&
        Math.abs(to - from) >= 1 &&
        typeof element.animate === 'function' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const ease = () => {
        if (!resize) return
        const style = getComputedStyle(element)
        element.animate(
          { width: [`${from}px`, `${to}px`] },
          {
            duration: parseFloat(
              style.getPropertyValue('--text-swap-duration')
            ),
            easing: style.getPropertyValue('--text-swap-easing').trim(),
          }
        )
      }
      // A frame held up by a long render still carries the time it was due
      // at, and an animation that starts in it has already run for that long
      // by the next one. Paint this frame as the start, then begin again in
      // a frame that is on time.
      if (frameIsLate()) {
        if (resize) element.style.width = `${from}px`
        frame = requestAnimationFrame(() => {
          element.style.width = ''
          element
            .getAnimations({ subtree: true })
            .forEach(animation => (animation.currentTime = 0))
          ease()
        })
      } else ease()
    })
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [current, instantWidth])

  return (
    <span
      key={current}
      ref={root}
      className={cn(
        'text-swap relative block overflow-hidden whitespace-nowrap',
        // Room for the blur to spread sideways before the clip cuts it
        '-mx-(--text-swap-blur) px-(--text-swap-blur)',
        className
      )}
      data-direction={
        outgoing === null
          ? 'forward'
          : (getDirection?.(current, outgoing) ?? 'forward')
      }
      data-changing={outgoing === null ? undefined : ''}
      aria-hidden="true"
    >
      <span className="text-swap-outgoing absolute inset-x-(--text-swap-blur) inset-y-0 opacity-0">
        {outgoing !== null && format(outgoing)}
      </span>
      <span className="text-swap-current block">{format(current)}</span>
    </span>
  )
}

/** More than a frame or two behind: the page was busy when it was due. */
const LATE_FRAME_MS = 32

function frameIsLate() {
  const due = document.timeline?.currentTime
  return typeof due === 'number' && performance.now() - due > LATE_FRAME_MS
}
