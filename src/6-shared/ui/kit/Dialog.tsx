import { useId, type ReactElement, type ReactNode } from 'react'
import { Dialog as Primitive } from '@base-ui/react/dialog'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import type { PopupController, SurfaceController } from '@/6-shared/overlays'
import { useVisualViewport } from '../useVisualViewport'
import { cn } from '../shadcn/utils'
import { BottomSheetSurface } from './Drawer'
import {
  SurfaceContent,
  SurfaceCloseButton,
  useSurfaceFinalFocus,
  type SurfaceName,
} from './SurfaceContent'
import { useOwnedPopup } from './useOwnedPopup'
import { useBottomSheetLayout } from './useBottomSheetLayout'
import './Surface.css'
import { modalBackdropClass } from './backdrop'

type DialogOptions = SurfaceName & {
  'aria-describedby'?: string
  children: ReactNode
  trigger?: ReactElement
  disabled?: boolean
  /** Keep the editor open when its backdrop is pressed. */
  disablePointerDismissal?: boolean
  mobile?: 'dialog' | 'drawer'
  /** Centered dialogs show a close button; bottom sheets never do. */
  closeButton?: boolean
  className?: string
  contentClassName?: string
  initialFocus?: Primitive.Popup.Props['initialFocus']
  finalFocus?: Primitive.Popup.Props['finalFocus']
}
export type DialogProps = DialogOptions & {
  /** Register once in the owner; includes Back, never technical unmount. */
  onClose?: () => void
  popup?: PopupController
}
export type DialogSurfaceProps = DialogOptions & {
  controller: SurfaceController
}

export function Dialog(props: DialogProps) {
  const { popup, onClose, ...restProps } = props
  const controller = useOwnedPopup({
    popup,
    onClose,
    unavailable: props.disabled,
  })
  return <DialogSurface {...restProps} controller={controller} />
}

export function DialogSurface(props: DialogSurfaceProps) {
  const { mobile = 'dialog', closeButton, ...restProps } = props
  const narrow = useBottomSheetLayout()
  const finalFocus = useSurfaceFinalFocus(props)
  return narrow && mobile === 'drawer' ? (
    <BottomSheetSurface {...restProps} finalFocus={finalFocus} />
  ) : (
    <CenteredDialog
      {...restProps}
      closeButton={closeButton}
      finalFocus={finalFocus}
    />
  )
}

/** Internal shared frame for Dialog and Confirm's AlertDialog primitive. */
export function AlertDialogSurface(props: DialogSurfaceProps) {
  const finalFocus = useSurfaceFinalFocus(props)
  return <CenteredDialog {...props} finalFocus={finalFocus} alert />
}

function CenteredDialog(props: DialogSurfaceProps & { alert?: boolean }) {
  const {
    title,
    label,
    children,
    trigger,
    disabled,
    disablePointerDismissal,
    controller,
    className,
    contentClassName,
    initialFocus,
    finalFocus,
    alert = false,
    closeButton = true,
    'aria-describedby': descriptionId,
  } = props
  const { open, setOpen: onOpenChange } = controller
  const titleId = useId()
  const viewport = useVisualViewport()
  const Root = alert ? AlertDialog.Root : Primitive.Root
  const Popup = alert ? AlertDialog.Popup : Primitive.Popup
  const Close = alert ? AlertDialog.Close : Primitive.Close
  return (
    <Root
      open={open}
      onOpenChange={onOpenChange}
      {...(alert ? {} : { disablePointerDismissal })}
    >
      {trigger && <Primitive.Trigger render={trigger} disabled={disabled} />}
      <Primitive.Portal>
        <Primitive.Backdrop
          forceRender
          className={cn('kit-surface-fade', modalBackdropClass)}
        />
        <Primitive.Viewport
          className="pointer-events-none fixed inset-0 z-modal flex items-center justify-center p-4"
          style={viewport ?? undefined}
        >
          <Popup
            aria-label={label}
            aria-describedby={descriptionId}
            aria-labelledby={title != null ? titleId : undefined}
            initialFocus={initialFocus}
            finalFocus={finalFocus}
            className={cn(
              'kit-surface-fade pointer-events-auto flex max-h-full w-full max-w-120 flex-col overflow-hidden rounded-ui-card rounded-smooth bg-ui-card text-ui-primary shadow-ui-popover outline-none',
              className
            )}
          >
            <SurfaceContent
              title={title}
              titleId={titleId}
              className={contentClassName}
              close={
                closeButton ? (
                  <Close render={<SurfaceCloseButton />} />
                ) : undefined
              }
            >
              {children}
            </SurfaceContent>
          </Popup>
        </Primitive.Viewport>
      </Primitive.Portal>
    </Root>
  )
}
