import type { ReactNode } from 'react'
import { Collapsible } from '@base-ui/react/collapsible'
import { cn } from './shadcn/utils'
import './Collapse.css'

export type CollapseProps = {
  /** legacy UI called this `in`. Nothing here toggles itself; the caller owns it. */
  open: boolean
  className?: string
  children?: ReactNode
}

/** legacy UI's `Collapse`, which is the only transition this app ever used from it.
 *
 * Content is unmounted while closed, the way every call site asked for with
 * `unmountOnExit`. There is no trigger: Base UI's `Collapsible` pairs a panel
 * with a button that opens it, and not one of these panels is opened by a
 * button that sits next to it — the archived accounts have a row of their
 * own, the envelope group has a whole header — so the root is driven and the
 * trigger left out. */
export function Collapse({ open, className, children }: CollapseProps) {
  return (
    // `contents`: legacy UI animated one box, and the root is only here to carry
    // Base UI's state.
    <Collapsible.Root open={open} className="contents">
      <Collapsible.Panel className={cn('owned-collapse', className)}>
        {children}
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
