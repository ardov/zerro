import { useRender } from '@base-ui/react/use-render'
import { useLayoutEffect, useRef, useState } from 'react'
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
  const [overflow, setOverflow] = useState(false)
  useLayoutEffect(() => {
    const element = ref.current!
    const measure = () =>
      setOverflow(element.scrollWidth > element.clientWidth + 1)
    measure()
    let frame = 0
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    const observer = new ResizeObserver(scheduleMeasure)
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
  }, [children])
  return useRender({
    defaultTagName: 'span',
    render,
    ref: [ref, forwardedRef ?? null],
    props: {
      ...props,
      'data-overflow': overflow || undefined,
      className: cn(
        'block min-w-0 overflow-hidden whitespace-nowrap data-overflow:mask-[linear-gradient(to_right,black_calc(100%_-_24px),transparent)]',
        className
      ),
      children,
    },
  })
}
