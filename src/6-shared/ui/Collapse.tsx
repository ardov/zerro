import type { ReactNode } from 'react'
import { Collapsible } from '@base-ui/react/collapsible'
import { cn } from './shadcn/utils'
import './Collapse.css'

export type CollapseProps = {
  /** Controlled open state; the component never toggles itself. */
  open: boolean
  className?: string
  children?: ReactNode
}

/** A controlled disclosure whose content is unmounted while closed. There is
 * no trigger: Base UI's `Collapsible` pairs a panel
 * with a button that opens it, and not one of these panels is opened by a
 * button that sits next to it — the archived accounts have a row of their
 * own, the envelope group has a whole header — so the root is driven and the
 * trigger left out. */
export function Collapse({ open, className, children }: CollapseProps) {
  return (
    // The root only carries Base UI state; the panel is the animated box.
    <Collapsible.Root open={open} className="contents">
      <Collapsible.Panel className={cn('collapse-panel', className)}>
        {children}
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
