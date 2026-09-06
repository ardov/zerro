import type { HTMLAttributes, ReactNode } from 'react'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { ListRowBacking, listRowClass } from './ListRow'
import {
  overAnchor,
  popupPositioning,
  overlaySurfaceClass,
} from './overlaySurface'
import { cn } from './shadcn/utils'
import { useScrollFade } from './useScrollFade'

export type MenuProps = Pick<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'aria-label' | 'aria-labelledby'
> & {
  open: boolean
  onClose?: () => void
  /** Element the menu is positioned against. */
  anchorEl?: Element | null
  /** A point to open at instead, for a context menu that was opened by a
   * right click or a long press and has no element to hang off. */
  anchorPosition?: { left: number; top: number }
  /** Which corner the menu grows from. The default puts the menu's top-left
   * on the anchor's top-left; `top-end` is the transaction action bar, which
   * sits at the bottom of the screen and has to open upward. */
  placement?: 'bottom-start' | 'top-end'
  /** Runs once the menu has finished closing. Chaining a second surface off a
   * menu needs this: opening it while the menu is still animating out moves
   * focus twice. */
  onCloseComplete?: () => void
  children?: ReactNode
}

/** A popup with menu semantics, positioned against an element or
 * a point.
 *
 * This is the counterpart to `ActionList`, which is a toolbar. A menu was
 * opened by something and can be dismissed, so `role="menu"` promises nothing
 * it does not deliver here. Base UI supplies the focus trap, the arrows,
 * typeahead and dismissal.
 *
 * Openness belongs to the caller, which for a menu means the overlay stack —
 * so Back closes it rather than leaving the page. */
export function Menu({
  open,
  onClose,
  anchorEl,
  anchorPosition,
  placement = 'bottom-start',
  onCloseComplete,
  className,
  children,
  ...props
}: MenuProps) {
  const anchor = anchorPosition
    ? {
        getBoundingClientRect: () =>
          new DOMRect(anchorPosition.left, anchorPosition.top, 0, 0),
      }
    : anchorEl
  const openUp = placement === 'top-end'
  const fadeRef = useScrollFade<HTMLDivElement>()

  return (
    <MenuPrimitive.Root
      open={open}
      onOpenChange={next => {
        if (!next) onClose?.()
      }}
      onOpenChangeComplete={next => {
        if (!next) onCloseComplete?.()
      }}
    >
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner
          {...popupPositioning}
          anchor={anchor}
          side={openUp ? 'top' : 'bottom'}
          align={openUp ? 'end' : 'start'}
          // A menu opening upward already sits above its anchor.
          sideOffset={openUp ? 0 : overAnchor}
        >
          <MenuPrimitive.Popup
            {...props}
            ref={fadeRef}
            data-slot="menu"
            className={cn(overlaySurfaceClass, 'min-w-[112px]', className)}
          >
            {children}
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  )
}

/** Closing is the call site's job, so `closeOnClick` is off.
 *
 * These menus live on the history stack: closing has to go through the
 * popover's own `onClose` so the entry pops exactly once. Letting Base UI
 * close the menu as well would pop it twice and send the user back a page. */
export function MenuItem({
  className,
  selected,
  children,
  ...props
}: Omit<MenuPrimitive.Item.Props, 'className'> & {
  className?: string
  selected?: boolean
}) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      data-selected={selected || undefined}
      closeOnClick={false}
      className={cn(listRowClass, className)}
      {...props}
    >
      <ListRowBacking selected={selected} />
      {children}
    </MenuPrimitive.Item>
  )
}
