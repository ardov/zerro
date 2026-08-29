import type { ReactNode } from 'react'
import { Drawer } from '@base-ui/react/drawer'
import { useTranslation } from 'react-i18next'
import { useOverlayFocus } from './useOverlayFocus'
import { drawerBackdropClass, drawerSurfaceClass } from './popupSurface'
import { cn } from './shadcn/utils'

export type SideDrawerProps = {
  open: boolean
  onClose?: () => void
  /** The edge it slides in from and is swiped back out towards. Every caller
   * is `right` so far; the two vertical
   * edges belong to `SmartDialog` and the adaptive popover, which round their
   * leading corners. */
  side?: 'left' | 'right'
  /** The sheet's width. Its height is always the full viewport. */
  className?: string
  children?: ReactNode
  'aria-label'?: string
  'aria-labelledby'?: string
}

/** A full-height sheet off a side edge, over a
 * dimmed page, dismissed by the backdrop, Escape or a swipe back towards its
 * own edge.
 *
 * Square rather than rounded; bottom sheets own their leading-corner radius.
 * The swipe is Base UI's and cannot be turned off, only aimed: its
 * default is `down`, which on a full-height sheet fights the sheet's own
 * vertical scrolling and drags it off an edge it never came from. Aiming it
 * at `side` is what makes the gesture undo the entrance. */
export function SideDrawer({
  open,
  onClose,
  side = 'right',
  className,
  children,
  ...props
}: SideDrawerProps) {
  const { t } = useTranslation()
  const { finalFocus } = useOverlayFocus(open)
  return (
    <Drawer.Root
      open={open}
      onOpenChange={next => {
        if (!next) onClose?.()
      }}
      swipeDirection={side}
    >
      <Drawer.Portal>
        <Drawer.Backdrop
          data-slot="side-drawer-backdrop"
          className={cn(
            drawerBackdropClass,
            'fixed inset-0 z-modal bg-black/50'
          )}
        />
        <Drawer.Viewport
          className={cn(
            'pointer-events-none fixed inset-0 z-modal flex',
            side === 'left' ? 'justify-start' : 'justify-end'
          )}
        >
          <Drawer.Popup
            {...props}
            data-slot="side-drawer"
            data-placement={side}
            finalFocus={finalFocus}
            className={cn(
              drawerSurfaceClass,
              // A flex column that scrolls as a whole.
              'pointer-events-auto relative flex h-full flex-col overflow-y-auto bg-card text-card-foreground shadow-elevation-16 outline-none [--drawer-radius:0px]',
              className
            )}
          >
            <Drawer.Content className="contents">{children}</Drawer.Content>
            {/* A Close part enables Base UI's focus trap, and it is the escape
                hatch assistive technology gets. */}
            <Drawer.Close className="sr-only">{t('close')}</Drawer.Close>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
