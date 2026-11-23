import type { ReactNode } from 'react'
import { Collapsible } from '@base-ui/react/collapsible'
import { cn } from '@/6-shared/ui/shadcn/utils'
import './Collapse.css'

export type CollapseProps = {
  open: boolean
  className?: string
  children?: ReactNode
}

/** Use a controlled root without a trigger so an external control can toggle the unmounted panel. */
export function Collapse(props: CollapseProps) {
  const { open, className, children } = props
  return (
    <Collapsible.Root open={open} className="contents">
      <Collapsible.Panel className={cn('collapse-panel', className)}>
        {children}
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
