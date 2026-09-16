import { useId, type ReactElement, type ReactNode } from 'react'
import { Drawer as Primitive } from '@base-ui/react/drawer'
import { useTranslation } from 'react-i18next'
import type { PopupController, SurfaceController } from '@/6-shared/overlays'
import { useOverlayFinalFocus } from '../useOverlayFinalFocus'
import { MobileDrawerViewport } from '../MobileDrawerViewport'
import { cn } from '@/6-shared/ui/shadcn/utils'
import {
  SurfaceContent,
  SurfaceCloseButton,
  type SurfaceName,
} from './SurfaceContent'
import { useOwnedPopup } from './useOwnedPopup'
import { useBottomSheetLayout } from './useBottomSheetLayout'
import './Drawer.css'

export type DrawerProps = SurfaceName & {
  'aria-describedby'?: string
  /** Auto uses bottom below 500px and right on wider screens. */
  side?: 'auto' | 'bottom' | 'right'
  className?: string
  contentClassName?: string
  children: ReactNode
  onClose?: () => void
  disabled?: boolean
  trigger?: ReactElement
  popup?: PopupController
}

/** History owns visibility; Base UI owns the modal and swipe gesture. */
export function Drawer(props: DrawerProps) {
  const { popup, onClose, ...restProps } = props
  const controller = useOwnedPopup({
    popup,
    onClose,
    unavailable: restProps.disabled,
  })
  return <DrawerSurface {...restProps} controller={controller} />
}

/** Shared rendering for surfaces whose owner already registered a history entry. */
export function DrawerSurface(
  props: Omit<DrawerProps, 'popup' | 'onClose'> & {
    controller: SurfaceController
    finalFocus?: Primitive.Popup.Props['finalFocus']
    initialFocus?: Primitive.Popup.Props['initialFocus']
  }
) {
  const {
    label,
    'aria-describedby': descriptionId,
    title,
    initialFocus,
    children,
    trigger,
    controller,
    finalFocus,
    disabled,
    side: requestedSide = 'auto',
    className,
    contentClassName,
  } = props
  const { open, setOpen: onOpenChange } = controller
  const { t } = useTranslation()
  const titleId = useId()
  const bottomSheet = useBottomSheetLayout()
  const side =
    requestedSide === 'auto'
      ? bottomSheet
        ? 'bottom'
        : 'right'
      : requestedSide
  const capturedFinalFocus = useOverlayFinalFocus(open, { fallback: true })
  // A Base UI trigger already owns focus restoration. Hosted surfaces need
  // the focused opener captured before their content mounts and takes focus.
  const resolvedFinalFocus =
    finalFocus ?? (trigger ? undefined : capturedFinalFocus)
  return (
    <Primitive.Root
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection={side === 'bottom' ? 'down' : 'right'}
    >
      {trigger && <Primitive.Trigger disabled={disabled} render={trigger} />}
      <Primitive.Portal>
        <Primitive.Backdrop
          forceRender
          className="kit-drawer-backdrop fixed inset-0 z-modal bg-ui-backdrop"
        />
        <MobileDrawerViewport
          className={cn(
            'flex',
            side === 'bottom' ? 'items-end' : 'justify-end p-ui-drawer-inset'
          )}
        >
          <Primitive.Popup
            aria-label={label}
            aria-describedby={descriptionId}
            aria-labelledby={title != null ? titleId : undefined}
            initialFocus={initialFocus}
            data-side={side}
            finalFocus={resolvedFinalFocus}
            className={cn(
              'kit-drawer-popup pointer-events-auto relative flex flex-col overflow-hidden rounded-smooth bg-ui-card text-ui-primary shadow-ui-popover outline-none',
              side === 'bottom'
                ? 'max-h-[calc(100%-32px)] w-full rounded-t-ui-popover'
                : 'h-full w-90 max-w-full rounded-ui-popover',
              className
            )}
          >
            {side === 'bottom' && (
              <div
                aria-hidden
                className="flex h-6 shrink-0 items-center justify-center"
              >
                <span className="h-1 w-8 rounded-full bg-ui-border" />
              </div>
            )}
            <Primitive.Content className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[max(8px,env(safe-area-inset-bottom))]">
              <SurfaceContent
                title={title}
                titleId={titleId}
                className={cn(title == null && 'px-2 py-0', contentClassName)}
                close={
                  side === 'right' && title != null ? (
                    <Primitive.Close render={<SurfaceCloseButton />} />
                  ) : undefined
                }
              >
                {children}
              </SurfaceContent>
            </Primitive.Content>
            {(side === 'bottom' || title == null) && (
              <Primitive.Close className="sr-only">
                {t('close')}
              </Primitive.Close>
            )}
          </Primitive.Popup>
        </MobileDrawerViewport>
      </Primitive.Portal>
    </Primitive.Root>
  )
}
