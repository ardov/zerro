import { useLayoutEffect, useRef } from 'react'
import type { OverlayController } from './controller'

/** Subscribe in the owner, above conditional or adaptive surface content. */
export function useCloseNotification(
  { subscribeClose }: Pick<OverlayController, 'subscribeClose'>,
  onClose?: () => void
) {
  const callback = useRef(onClose)
  const enabled = onClose !== undefined
  useLayoutEffect(() => {
    callback.current = onClose
  })
  useLayoutEffect(() => {
    if (!enabled) return
    return subscribeClose(() => callback.current?.())
  }, [subscribeClose, enabled])
}
