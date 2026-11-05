import type { ReactNode } from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'

/** The labelled row shared by checkbox and switch fields. */
export function ToggleLabel(props: {
  label: ReactNode
  disabled?: boolean
  readOnly?: boolean
  className?: string
  children: ReactNode
}) {
  const { label, disabled, readOnly, className, children } = props
  return (
    <label
      className={cn(
        'kit-toggle-label flex min-h-12 items-start gap-3 py-3 text-ui-16 text-ui-primary',
        disabled || readOnly ? 'cursor-default' : 'cursor-pointer',
        className
      )}
    >
      {children}
      <span className={cn('min-w-0', disabled && 'opacity-ui-disabled')}>
        {label}
      </span>
    </label>
  )
}
