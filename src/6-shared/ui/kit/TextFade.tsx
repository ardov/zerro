import { useRender } from '@base-ui/react/use-render'
import { useLayoutEffect, useRef } from 'react'
import { cn } from '../shadcn/utils'

/** Single-line clipping that fades only overflowing text, leaving sibling actions intact.
 * Use render to preserve semantic tags and ref to access the actual text element. */
export function TextFade({
  children,
  className,
  render,
  ref: forwardedRef,
  ...props
}: useRender.ComponentProps<'span'>) {
  const ref = useRef<HTMLSpanElement>(null)
  const observed = useRef<{ element: HTMLElement; stop: () => void } | null>(
    null
  )
  // Checked after every commit, so a new element, for example from a
  // different `render` tag, gets observed too. Text changes inside the same
  // element reach the MutationObserver.
  useLayoutEffect(() => {
    const element = ref.current
    if (observed.current?.element === element) return
    observed.current?.stop()
    observed.current = element
      ? { element, stop: observeOverflow(element) }
      : null
  })
  useLayoutEffect(
    () => () => {
      observed.current?.stop()
      observed.current = null
    },
    []
  )
  return useRender({
    defaultTagName: 'span',
    render,
    ref: [ref, forwardedRef ?? null],
    props: {
      ...props,
      className: cn(
        'block min-w-0 overflow-hidden whitespace-nowrap data-overflow:mask-[linear-gradient(to_right,black_calc(100%_-_24px),transparent)]',
        className
      ),
      children,
    },
  })
}

/** Keeps `data-overflow` on the element while its text is clipped. The
 * attribute is written directly: no state, so no extra render. */
function observeOverflow(element: HTMLElement): () => void {
  const measure = () =>
    element.toggleAttribute(
      'data-overflow',
      element.scrollWidth > element.clientWidth + 1
    )
  let frame = 0
  const scheduleMeasure = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(measure)
  }
  // ResizeObserver reports after layout and before paint, once right after
  // observe() too, so the first measurement needs no forced layout and the
  // fade is in place for the first frame.
  const observer = new ResizeObserver(measure)
  observer.observe(element)
  // A child can update its own text without rerendering this component
  // or changing the clipped element's dimensions.
  const contentObserver = new MutationObserver(scheduleMeasure)
  contentObserver.observe(element, {
    childList: true,
    characterData: true,
    subtree: true,
  })
  return () => {
    observer.disconnect()
    contentObserver.disconnect()
    cancelAnimationFrame(frame)
  }
}
