import { useCallback, useEffect } from 'react'
import { usePopup, type PopupController } from '@/6-shared/overlays'
import { useCloseNotification } from '@/6-shared/overlays/useCloseNotification'

/** The rendering owner releases its history entry when unavailable or gone. */
export function useOwnedPopup(props: {
  popup?: PopupController
  unavailable?: boolean
  onClose?: () => void
}): PopupController {
  const { popup, unavailable = false, onClose } = props
  const internalPopup = usePopup()
  const controller = popup ?? internalPopup
  const { open, setOpen: changeOpen, release } = controller
  useCloseNotification(controller, onClose)
  useEffect(() => {
    if (unavailable && open) changeOpen(false)
  }, [unavailable, open, changeOpen])
  useEffect(() => release, [release])
  const setOpen = useCallback(
    (next: boolean) => {
      if (!next || !unavailable) changeOpen(next)
    },
    [changeOpen, unavailable]
  )
  return { ...controller, open: open && !unavailable, setOpen }
}
