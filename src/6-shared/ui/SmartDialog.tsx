import type { ReactNode } from 'react'
import { Drawer } from '@base-ui/react/drawer'
import { useTranslation } from 'react-i18next'
import { useBreakpointDown } from '6-shared/hooks/useBreakpointDown'
import { popoverStack } from '6-shared/historyPopovers'
import { Dialog } from './Dialog'
import { useOverlayFocus } from './useOverlayFocus'
import { drawerBackdropClass, drawerSurfaceClass } from './popupSurface'
import { cn } from './shadcn/utils'

export type TSmartDialogProps = {
  /** Its place on the popover stack, so Back closes it rather than leaving the
   * page. Unlike a select's, this key is written down: `registerPopover` hands
   * out the same one to whatever opens the dialog. */
  elKey: string
  className?: string
  children?: ReactNode
  'aria-label'?: string
}

/** A dialog on desktop and a bottom drawer on a phone.
 *
 * Only history closes it: `onClose` pops the stack entry, and the open state
 * comes back from the stack rather than from state of its own. */
export function SmartDialog({
  elKey,
  className,
  children,
  ...props
}: TSmartDialogProps) {
  const { t } = useTranslation()
  const [open, , onClose] = popoverStack.usePopoverState(elKey)
  const isMobile = useBreakpointDown('sm')
  const { finalFocus } = useOverlayFocus(open)

  if (!isMobile) {
    return (
      <Dialog {...props} open={open} onClose={onClose} className={className}>
        {children}
      </Dialog>
    )
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={next => {
        if (!next) onClose()
      }}
      swipeDirection="down"
    >
      <Drawer.Portal>
        <Drawer.Backdrop
          className={cn(
            drawerBackdropClass,
            'fixed inset-0 z-modal bg-black/50'
          )}
        />
        <Drawer.Viewport className="pointer-events-none fixed inset-0 z-modal flex items-end">
          <Drawer.Popup
            {...props}
            finalFocus={finalFocus}
            data-slot="dialog"
            data-placement="bottom"
            className={cn(
              drawerSurfaceClass,
              // This bottom sheet is less rounded than the popover drawer.
              'pointer-events-auto relative flex max-h-[calc(100dvh-48px)] w-full flex-col overflow-y-auto bg-card text-card-foreground shadow-elevation-16 outline-none [--drawer-radius:8px]',
              className
            )}
          >
            <Drawer.Content>{children}</Drawer.Content>
            {/* A Close part is what enables Base UI's focus trap, and it is
                the escape hatch assistive technology gets. */}
            <Drawer.Close className="sr-only">{t('close')}</Drawer.Close>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
