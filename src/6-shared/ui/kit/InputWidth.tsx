import type { ReactNode } from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'

type InputWidthProps = {
  value: string
  placeholder?: string
  className?: string
  children: ReactNode
}

/** Measures text in the inherited typography; the input fills that width.
 * The trailing space keeps its caret visible, even for an empty value. */
export function InputWidth(props: InputWidthProps) {
  const { value, placeholder, className, children } = props
  return (
    <span
      className={cn(
        'relative inline-block min-w-0 max-w-full shrink [&>input]:absolute [&>input]:inset-0',
        className
      )}
    >
      <span
        aria-hidden
        className="invisible block overflow-hidden pr-0.5 whitespace-pre"
      >
        {value || placeholder || ' '}
      </span>
      {children}
    </span>
  )
}
