import { useState } from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'
import './TextSwap.css'

type TextSwapProps<T extends string> = {
  value: T
  formatValue?: (value: T) => string
  getDirection?: (next: T, previous: T) => 'forward' | 'backward'
  className?: string
}

/** Decorative text for a control that provides its current accessible name.
 * Two bounded layers replace each other without queuing rapid changes. */
export function TextSwap<T extends string>({
  value,
  formatValue,
  getDirection,
  className,
}: TextSwapProps<T>) {
  const [values, setValues] = useState<{
    current: T
    outgoing: T | null
  }>({ current: value, outgoing: null })
  if (values.current !== value) {
    setValues({ current: value, outgoing: values.current })
  }
  const format = (text: T) => formatValue?.(text) ?? text
  return (
    <span
      key={values.current}
      className={cn('text-swap relative block overflow-hidden', className)}
      data-direction={
        values.outgoing === null
          ? 'forward'
          : (getDirection?.(values.current, values.outgoing) ?? 'forward')
      }
      data-changing={values.outgoing === null ? undefined : ''}
      aria-hidden="true"
    >
      <span className="text-swap-outgoing absolute inset-0 opacity-0">
        {values.outgoing !== null && format(values.outgoing)}
      </span>
      <span className="text-swap-current block">{format(values.current)}</span>
    </span>
  )
}
