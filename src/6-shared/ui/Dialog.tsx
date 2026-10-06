import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { useOverlayFinalFocus } from './useOverlayFinalFocus'
import { cn } from './shadcn/utils'
import { ScrollArea } from './kit/ScrollArea'
import './Dialog.css'

export type DialogProps = {
  open: boolean
  /** Runs when the dialog asks to be closed: the backdrop, Escape, or a close
   * button. Nothing here closes itself — every caller owns the open state. */
  onClose?: () => void
  className?: string
  children?: ReactNode
  'aria-label'?: string
  'aria-labelledby'?: string
}

/** A paper centered over a dimmed page, at most 600px wide and
 * never taller than the window less its margins.
 *
 * Base UI supplies the modal behaviour — the focus trap, the scroll lock,
 * Escape and the outside press — and `Viewport` centers the paper. */
export function Dialog({
  open,
  onClose,
  className,
  children,
  ...props
}: DialogProps) {
  const finalFocus = useOverlayFinalFocus(open)
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={next => {
        if (!next) onClose?.()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="dialog-fade fixed inset-0 z-modal bg-black/50" />
        <DialogPrimitive.Viewport className="fixed inset-0 z-modal flex items-center justify-center">
          <DialogPrimitive.Popup
            {...props}
            finalFocus={finalFocus}
            data-slot="dialog"
            className={cn(
              'dialog-fade relative m-8 flex max-h-[calc(100%-64px)] max-w-[600px] flex-col rounded-lg bg-card text-card-foreground shadow-elevation-24 outline-none',
              className
            )}
          >
            {children}
          </DialogPrimitive.Popup>
        </DialogPrimitive.Viewport>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** An `h2` dialog heading. Base UI's `Title` is
 * what labels the dialog for assistive technology, so it is that rather than a
 * styled heading of our own. */
export function DialogTitle({
  className,
  ...props
}: Omit<DialogPrimitive.Title.Props, 'className'> & { className?: string }) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('m-0 flex-none px-6 py-4 text-title', className)}
      {...props}
    />
  )
}

/** The scrolling middle drops its top padding when a title sits above it,
 * which is a sibling rule rather than something the caller passes. The
 * padding is inside the scroll, so the rule sets it through a variable on
 * the scroll area that the content reads. */
export function DialogContent({
  className,
  children,
}: {
  className?: string
  children?: ReactNode
}) {
  return (
    <ScrollArea
      data-slot="dialog-content"
      className="min-h-0 flex-auto [--dialog-content-top:1.25rem] [[data-slot=dialog-title]+&]:[--dialog-content-top:0px]"
      contentClassName={cn('px-6 pt-(--dialog-content-top) pb-5', className)}
    >
      {children}
    </ScrollArea>
  )
}

/** Prose inside the content and the target of `aria-describedby`. */
export function DialogContentText({
  className,
  ...props
}: Omit<DialogPrimitive.Description.Props, 'className'> & {
  className?: string
}) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-content-text"
      className={cn('m-0 text-body text-muted-foreground', className)}
      {...props}
    />
  )
}

/** The row of buttons at the foot, right-aligned with 8px between them. */
export function DialogActions({
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-slot="dialog-actions"
      className={cn(
        'flex flex-none items-center justify-end gap-2 p-2',
        className
      )}
      {...props}
    />
  )
}
