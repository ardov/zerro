import { useCallback, useRef } from 'react'

export type TPendingEdit = (id: string, save?: () => void) => void

/** The screen owner can finish an input after its DOM unmounts without blur.
 * A layout change or remount alone never saves it. */
export function usePendingEdit() {
  const pending = useRef<{ id: string; save?: () => void } | null>(null)
  const finish = useCallback(() => {
    const previous = pending.current
    pending.current = null
    previous?.save?.()
  }, [])
  const register: TPendingEdit = useCallback((id, save) => {
    const previous = pending.current
    pending.current = { id, save }
    if (previous && previous.id !== id) previous.save?.()
  }, [])
  return { finish, register }
}
