import { useMemo, useId } from 'react'
import type { PopupController } from './controller'
import { useCloseNotification } from './useCloseNotification'
import { useOverlayMethods, useOverlayState } from './context'

/** History owns visibility. Keep this owner and its draft mounted while its
 * surface adapts or unmounts on close. Technical unmount never saves a draft. */
export function usePopup(onClose?: () => void): PopupController {
  const id = useId()
  const { openPopup, closePopup, subscribeClose } = useOverlayMethods()
  const { live } = useOverlayState()
  const methods = useMemo(
    () => ({
      setOpen: (next: boolean) => (next ? openPopup(id) : closePopup(id)),
      subscribeClose: (listener: () => void) => subscribeClose(id, listener),
      release: () => closePopup(id, false),
    }),
    [id, openPopup, closePopup, subscribeClose]
  )
  useCloseNotification(methods, onClose)
  return { open: live.includes(id), ...methods }
}
