import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { useState } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { findMuiFocusBoundary } from './muiFocusBoundary'
import { cn } from './shadcn/utils'
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

/** MUI's `Dialog`: a paper centred over a dimmed page, at most 600px wide and
 * never taller than the window less its margins.
 *
 * Base UI supplies the modal behaviour — the focus trap, the scroll lock,
 * Escape and the outside press — and `Viewport` is the flex box that centres
 * the paper, which is MUI's `container` under another name. */
export function Dialog({
  open,
  onClose,
  className,
  children,
  ...props
}: DialogProps) {
  const { container, finalFocus } = useDialogFocus(open)
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={next => {
        if (!next) onClose?.()
      }}
    >
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Backdrop className="owned-dialog fixed inset-0 z-modal bg-black/50" />
        <DialogPrimitive.Viewport className="fixed inset-0 z-modal flex items-center justify-center">
          <DialogPrimitive.Popup
            {...props}
            finalFocus={finalFocus}
            data-slot="dialog"
            className={cn(
              'owned-dialog relative m-8 flex max-h-[calc(100%-64px)] max-w-[600px] flex-col rounded-lg bg-card text-card-foreground shadow-elevation-24 outline-none',
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

/** Capture before the popup commits and its autofocus moves focus. The
 * initializer also covers forms that mount already open with a fresh key.
 * Keep this opening's target through updates and exit, then capture again on
 * the next opening. A MUI parent must contain the portal too: it cannot know
 * that a Base UI dialog elsewhere in the document is the top modal. */
export function useDialogFocus(open: boolean) {
  const [opening, setOpening] = useState(() => ({
    open,
    target: getFocusedElement(),
  }))
  if (open !== opening.open) {
    setOpening({
      open,
      target: open ? getFocusedElement() : opening.target,
    })
  }
  const target = opening.target
  return {
    container: findMuiFocusBoundary(target),
    finalFocus: () => (target?.isConnected ? target : true),
  }
}

function getFocusedElement() {
  if (typeof document === 'undefined') return null
  const focused = document.activeElement
  return focused instanceof HTMLElement ? focused : null
}

/** The heading MUI renders as an `h2` in its `h6` size. Base UI's `Title` is
 * what labels the dialog for assistive technology, so it is that rather than a
 * styled heading of our own. */
export function DialogTitle({
  className,
  ...props
}: Omit<DialogPrimitive.Title.Props, 'className'> & { className?: string }) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('m-0 flex-none px-6 py-4 type-title', className)}
      {...props}
    />
  )
}

/** The scrolling middle. MUI drops its top padding when a title sits above it,
 * which is a sibling rule rather than something the caller passes. */
export function DialogContent({
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-slot="dialog-content"
      className={cn(
        'flex-auto overflow-y-auto px-6 py-5 [[data-slot=dialog-title]+&]:pt-0',
        className
      )}
      {...props}
    />
  )
}

/** Prose inside the content. Base UI's `Description` is what `aria-describedby`
 * points at, and MUI's `DialogContentText` is the same paragraph. */
export function DialogContentText({
  className,
  ...props
}: Omit<DialogPrimitive.Description.Props, 'className'> & {
  className?: string
}) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-content-text"
      className={cn('m-0 type-body text-muted-foreground', className)}
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
