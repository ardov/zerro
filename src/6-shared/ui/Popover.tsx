import type { HTMLAttributes, ReactNode } from 'react'
import { useState } from 'react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { useTranslation } from 'react-i18next'
import { useOverlayFocus } from './useOverlayFocus'
import {
  anchoredSurfaceClass,
  overAnchor,
  popupPositioning,
} from './popupSurface'
import { cn } from './shadcn/utils'

/** A surface grows out of the corner selected by its alignment. */
const growOrigins = {
  start: '[--grow-origin:top_left]',
  center: '[--grow-origin:top_center]',
  end: '[--grow-origin:top_right]',
} as const

export type PopoverProps = Pick<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'aria-label' | 'aria-labelledby'
> & {
  open: boolean
  onClose?: () => void
  /** Runs once the entrance has finished. Content that measures itself
   * against the surface — an `Autocomplete`'s popper — cannot position
   * against one that is still scaling. */
  onOpenComplete?: () => void
  /** Positioning anchor, which need not be the button that opened the popup. */
  anchorEl?: Element | null
  /** Vertical placement: `over` lays
   * the paper's top edge over the anchor's own, `below` drops it clear. */
  placement?: 'over' | 'below'
  /** Horizontal alignment against the anchor. */
  align?: keyof typeof growOrigins
  children?: ReactNode
}

/** An anchored modal surface at every viewport size. Open state belongs to
 * the caller; nested popovers belong inside this one's React children so
 * Base UI can dismiss the top surface without dismissing its parent. */
export function Popover({
  open,
  onClose,
  onOpenComplete,
  anchorEl,
  placement = 'over',
  align = 'start',
  className,
  children,
  ...props
}: PopoverProps) {
  const { t } = useTranslation()
  const [lastAnchor, setLastAnchor] = useState(anchorEl)
  if (anchorEl && anchorEl !== lastAnchor) setLastAnchor(anchorEl)
  // Keep the geometry during exit, when a caller has already cleared anchorEl.
  const anchor = anchorEl?.isConnected
    ? anchorEl
    : lastAnchor?.isConnected
      ? lastAnchor
      : null
  const { finalFocus } = useOverlayFocus(open)
  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={next => {
        if (!next) onClose?.()
      }}
      onOpenChangeComplete={next => {
        if (next) onOpenComplete?.()
      }}
      modal
    >
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Backdrop
          data-slot="popover-backdrop"
          className="fixed inset-0 z-modal"
        />
        <PopoverPrimitive.Positioner
          {...popupPositioning}
          anchor={anchor}
          side="bottom"
          align={align}
          sideOffset={placement === 'below' ? 0 : overAnchor}
          collisionAvoidance={{ side: 'shift', align: 'shift' }}
          className={cn(popupPositioning.className, 'max-w-[calc(100vw-32px)]')}
        >
          <PopoverPrimitive.Popup
            {...props}
            data-slot="popover"
            finalFocus={finalFocus}
            className={cn(anchoredSurfaceClass, growOrigins[align], className)}
          >
            {children}
            {/* A Close part enables Base UI's modal focus trap. It is also an
                accessible escape hatch for assistive technology. */}
            <PopoverPrimitive.Close className="sr-only">
              {t('close')}
            </PopoverPrimitive.Close>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
