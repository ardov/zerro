import type { ComponentPropsWithoutRef } from 'react'
import { cn } from './shadcn/utils'

/**
 * MUI's `Divider` in its only shape this app draws: a full-width horizontal
 * rule. `min-w-0` and `shrink-0` are what keep it from being stretched or
 * squeezed by the flex containers it sits in.
 */
export function Divider({
  className,
  ...props
}: ComponentPropsWithoutRef<'hr'>) {
  return (
    <hr
      className={cn(
        'm-0 min-w-0 shrink-0 border-x-0 border-t-0 border-b border-solid border-border',
        className
      )}
      {...props}
    />
  )
}
