import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from 'react'
import { cn } from '../shadcn/utils'

/** Single-line clipping that fades only overflowing text, leaving sibling actions intact. */
export function TextFade({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<'span'>) {
  const ref = useRef<HTMLSpanElement>(null)
  const [overflow, setOverflow] = useState(false)
  useLayoutEffect(() => {
    const element = ref.current!
    const measure = () =>
      setOverflow(element.scrollWidth > element.clientWidth + 1)
    measure()
    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [children])
  return (
    <span
      {...props}
      ref={ref}
      data-overflow={overflow || undefined}
      className={cn(
        'block min-w-0 overflow-hidden whitespace-nowrap data-overflow:mask-[linear-gradient(to_right,black_calc(100%_-_24px),transparent)]',
        className
      )}
    >
      {children}
    </span>
  )
}
