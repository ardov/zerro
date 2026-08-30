import { useCallback, useId } from 'react'
import { useOverlayMethods, useOverlayState } from './context'

/** A popup that owns its own trigger — a select's list, a date picker's
 * calendar. All it needs from history is that Back closes it rather than
 * leaving the page.
 *
 * Nothing opens these by name, so the key is generated rather than asked for
 * at the call site: all the host needs is that no two live ones share one.
 *
 * The pair it returns is Base UI's `open` / `onOpenChange` shape, which is
 * what the popups this wraps already take. */
export function usePopup(): [boolean, (open: boolean) => void] {
  const id = useId()
  const { openPopup, closePopup } = useOverlayMethods()
  const { live } = useOverlayState()
  const setOpen = useCallback(
    (next: boolean) => (next ? openPopup(id) : closePopup(id)),
    [id, openPopup, closePopup]
  )
  return [live.includes(id), setOpen]
}
