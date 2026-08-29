import { useId } from 'react'
import { popoverStack } from './popoverStack'

/** Puts a popup on the popover stack, so Back closes it rather than leaving
 * the page.
 *
 * For the surfaces nothing opens by name — a select's list, a date picker's
 * calendar — so the key is generated instead of being asked for at the call
 * site: all the stack needs is that no two live ones share one. A surface
 * something else opens, and has to name to open, takes a written key through
 * `registerPopover` instead.
 *
 * The pair it returns is Base UI's `open` / `onOpenChange` shape, which is
 * what the popups this wraps already take. */
export function useStackedOpen(): [boolean, (open: boolean) => void] {
  const key = useId()
  const [open, onOpen, onClose] = popoverStack.usePopoverState(key)
  return [open, next => (next ? onOpen() : onClose())]
}
