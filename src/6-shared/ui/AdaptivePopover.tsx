import { Drawer } from '@base-ui/react/drawer'
import { useTranslation } from 'react-i18next'
import { useBreakpointDown } from '@/6-shared/hooks/useBreakpointDown'
import { Popover, type PopoverProps } from './Popover'
import { useOverlayFinalFocus } from './useOverlayFinalFocus'
import { cn } from './shadcn/utils'
import { drawerBackdropClass, drawerSurfaceClass } from './overlaySurface'
import { MobileDrawerViewport } from './MobileDrawerViewport'

/** Base UI names the vertical swipe directions `up`/`down`, so the edge a
 * drawer sits on does not spell its own swipe direction. */
const swipeDirections = {
  top: 'up',
  bottom: 'down',
  left: 'left',
  right: 'right',
} as const

export type AdaptivePopoverProps = PopoverProps & {
  /** Edge the mobile drawer slides in from. Ignored on desktop, where the
   * surface is the plain anchored `Popover`. */
  drawerSide?: keyof typeof swipeDirections
}

/** The same content as a drawer on a phone and as an anchored popover above
 * the breakpoint. History controls visibility; Base UI owns dismissal, focus
 * and scroll lock.
 *
 * The desktop half is `Popover` itself rather than a second copy of it. The
 * two were identical down to the grow variables, and above the breakpoint
 * this component has nothing of its own to add. */
export function AdaptivePopover({
  drawerSide = 'bottom',
  ...props
}: AdaptivePopoverProps) {
  const isMobile = useBreakpointDown('md')
  if (!isMobile) return <Popover {...props} />
  return <PopoverDrawer drawerSide={drawerSide} {...props} />
}

/** Its own component so each responsive half owns its hooks, and switching
 * between them cannot reorder anyone's. */
function PopoverDrawer({
  open,
  onClose,
  onOpenComplete,
  onCloseComplete,
  // Geometry against an anchor, which a drawer off an edge has none of. Named
  // here so they cannot reach the popup: everything left in `props` is an
  // attribute a `div` understands.
  anchorEl,
  placement,
  align,
  alignOffset,
  sideOffset,
  drawerSide,
  className,
  children,
  ...props
}: PopoverProps & { drawerSide: keyof typeof swipeDirections }) {
  const { t } = useTranslation()
  const finalFocus = useOverlayFinalFocus(open)
  return (
    <Drawer.Root
      open={open}
      onOpenChange={next => {
        if (!next) onClose?.()
      }}
      onOpenChangeComplete={next => {
        if (next) onOpenComplete?.()
        else onCloseComplete?.()
      }}
      swipeDirection={swipeDirections[drawerSide]}
    >
      <Drawer.Portal>
        <Drawer.Backdrop
          data-slot="adaptive-backdrop"
          className={cn(
            drawerBackdropClass,
            'fixed inset-0 z-modal bg-black/50'
          )}
        />
        <MobileDrawerViewport
          className={cn(
            'flex',
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
              drawerSurfaceClass,
              'pointer-events-auto relative max-h-[calc(100%-48px)] overflow-y-auto bg-popover text-popover-foreground shadow-elevation-16 outline-none',
              drawerSide === 'top' || drawerSide === 'bottom'
                ? 'w-full'
                : 'h-full',
              className
            )}
          >
            <Drawer.Content>{children}</Drawer.Content>
            {/* A Close part enables Base UI's modal focus trap. It is also an
                accessible escape hatch for assistive technology, so both
                responsive variants carry one. */}
            <Drawer.Close className="sr-only">{t('close')}</Drawer.Close>
          </Drawer.Popup>
        </MobileDrawerViewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
