import type { HTMLAttributes, ReactNode } from 'react'
import { useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { Drawer } from '@base-ui/react/drawer'
import { useTranslation } from 'react-i18next'
import { useBreakpointDown } from '6-shared/hooks/useBreakpointDown'
import { cn } from './shadcn/utils'
import { findMuiFocusBoundary } from './muiFocusBoundary'
import './AdaptivePopover.css'

/** Base UI names the vertical swipe directions `up`/`down`, so the edge a
 * drawer sits on does not spell its own swipe direction. */
const swipeDirections = {
  top: 'up',
  bottom: 'down',
  left: 'left',
  right: 'right',
} as const

export type AdaptivePopoverProps = Pick<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'aria-label' | 'aria-labelledby'
> & {
  open: boolean
  onClose?: () => void
  /** Element the desktop popover is positioned against. */
  anchorEl?: Element | null
  /** Edge the mobile drawer slides in from. Ignored on desktop, where the
   * surface is a popover positioned against `anchorEl`. */
  drawerSide?: keyof typeof swipeDirections
  /** Portal target. Defaults to the MUI dialog or drawer the anchor sits in,
   * so the surface stays inside that parent's focus trap while both libraries
   * ship. Pass `null` to force the surface to the document body. */
  container?: HTMLElement | null
  children?: ReactNode
}

/** History controls visibility; Base UI owns dismissal, focus and scroll lock. */
export function AdaptivePopover({
  open,
  onClose,
  anchorEl,
  drawerSide = 'bottom',
  container: containerProp,
  className,
  children,
  ...props
}: AdaptivePopoverProps) {
  const { t } = useTranslation()
  const isMobile = useBreakpointDown('md')
  // Keep the external trigger through the exit transition, even when callers
  // clear anchorEl as soon as they close the surface.
  const [lastAnchor, setLastAnchor] = useState(anchorEl)
  if (anchorEl && anchorEl !== lastAnchor) setLastAnchor(anchorEl)
  // A retained anchor that has left the document is worse than none: it can
  // neither be positioned against nor focused, and it would drag the portal
  // into a detached container with it.
  const retained = lastAnchor?.isConnected ? lastAnchor : null
  const trigger = anchorEl ?? retained
  const container =
    containerProp === undefined ? findMuiFocusBoundary(trigger) : containerProp
  const finalFocus = () =>
    trigger instanceof HTMLElement && trigger.isConnected ? trigger : true
  const onOpenChange = (next: boolean) => {
    if (!next) onClose?.()
  }

  if (isMobile) {
    return (
      <Drawer.Root
        open={open}
        onOpenChange={onOpenChange}
        swipeDirection={swipeDirections[drawerSide]}
      >
        <Drawer.Portal container={container ?? undefined}>
          <Drawer.Backdrop
            data-slot="adaptive-backdrop"
            className="adaptive-backdrop fixed inset-0 z-modal bg-black/50"
          />
          <Drawer.Viewport
            className={cn(
              'pointer-events-none fixed inset-0 z-modal flex',
              drawerSide === 'top' && 'items-start',
              drawerSide === 'bottom' && 'items-end',
              drawerSide === 'left' && 'justify-start',
              drawerSide === 'right' && 'justify-end'
            )}
          >
            <Drawer.Popup
              {...props}
              data-slot="adaptive-popup"
              data-placement={drawerSide}
              finalFocus={finalFocus}
              className={cn(
                'adaptive-drawer pointer-events-auto relative max-h-[calc(100dvh-48px)] overflow-y-auto bg-popover text-popover-foreground shadow-elevation-16 outline-none',
                drawerSide === 'top' || drawerSide === 'bottom'
                  ? 'w-full'
                  : 'h-full',
                className
              )}
            >
              <Drawer.Content>{children}</Drawer.Content>
              <Drawer.Close className="sr-only">{t('close')}</Drawer.Close>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    )
  }

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange} modal>
      <Popover.Portal container={container ?? undefined}>
        <Popover.Backdrop
          data-slot="adaptive-backdrop"
          className="fixed inset-0 z-modal"
        />
        <Popover.Positioner
          anchor={trigger}
          side="bottom"
          align="start"
          sideOffset={({ anchor }) => -anchor.height}
          collisionPadding={16}
          collisionAvoidance={{ side: 'shift', align: 'shift' }}
          positionMethod="fixed"
          className="z-modal max-w-[calc(100vw-32px)]"
        >
          <Popover.Popup
            {...props}
            data-slot="adaptive-popup"
            finalFocus={finalFocus}
            className={cn(
              'adaptive-popover max-h-[calc(100dvh-32px)] overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-elevation-8 outline-none',
              className
            )}
          >
            {children}
            {/* A Close part enables Base UI's modal focus trap. It is also an
                accessible escape hatch for assistive technology, so both
                responsive variants carry one. */}
            <Popover.Close className="sr-only">{t('close')}</Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
