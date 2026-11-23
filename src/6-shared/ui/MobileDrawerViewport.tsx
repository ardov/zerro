import { Drawer } from '@base-ui/react/drawer'
import type { ReactNode } from 'react'
import { useVisualViewport } from './useVisualViewport'
import { cn } from './shadcn/utils'

type MobileDrawerViewportProps = {
  children?: ReactNode
  className?: string
}

/** The keyboard can shrink only the visual viewport. Size the drawer against it so content stays above the keyboard. */
export function MobileDrawerViewport({
  children,
  className,
}: MobileDrawerViewportProps) {
  const viewport = useVisualViewport()

  return (
    <Drawer.Viewport
      data-slot="mobile-drawer-viewport"
      className={cn(
        'pointer-events-none fixed top-0 left-0 z-modal h-full w-full',
        className
      )}
      style={viewport ?? undefined}
    >
      {children}
    </Drawer.Viewport>
  )
}
