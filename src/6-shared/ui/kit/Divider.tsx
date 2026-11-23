import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'

export function Divider(props: ComponentPropsWithoutRef<'hr'>) {
  const { className, ...restProps } = props
  return (
    <hr
      className={cn(
        'm-0 min-w-0 shrink-0 border-x-0 border-t-0 border-b border-solid border-ui-border',
        className
      )}
      {...restProps}
    />
  )
}
