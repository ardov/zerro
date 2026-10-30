import { useEffect, useLayoutEffect, useRef } from 'react'
import { useOverlayMethods } from './context'

/** Keep the latest pending edit through a Back commit that unmounts its
 * editor before the host sends the close notification. */
export function useScreenClose(id: string, onClose?: () => void) {
  const { subscribeClose } = useOverlayMethods()
  const callback = useRef(onClose)
  useLayoutEffect(() => {
    callback.current = onClose
  })
  const enabled = onClose !== undefined
  useEffect(() => {
    if (!enabled) return
    return subscribeClose(id, () => callback.current?.())
  }, [id, subscribeClose, enabled])
}
