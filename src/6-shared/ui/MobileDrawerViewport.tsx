import { Drawer } from '@base-ui/react/drawer'
import type { ReactNode } from 'react'
import { useVisualViewport } from './useVisualViewport'
import { cn } from './shadcn/utils'

type MobileDrawerViewportProps = {
  children?: ReactNode
  className?: string
}

/** The part of the screen a mobile drawer can actually occupy.
 *
 * A software keyboard usually shrinks the visual viewport without shrinking
 * the page. Following that viewport here keeps every drawer — and ordinary
 * sticky content inside it — above the keyboard without teaching forms about
 * browser geometry. */
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
