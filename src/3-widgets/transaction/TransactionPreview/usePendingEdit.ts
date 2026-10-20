import { useCallback, useLayoutEffect, useRef } from 'react'

export type TPendingEdit = (id: string, save?: () => void) => void

/** The screen owner outlives its fields. Close notifications can finish a
 * valid active input even after React has removed it without a blur event.
 * Merely unmounting or changing the drawer layout does not save anything. */
export function usePendingEdit(active = true) {
  const pending = useRef<{ id: string; save?: () => void } | null>(null)
  // A hidden presentation no longer owns an editor. Drop its callback before
  // a later selection or close can accidentally save that removed draft.
  useLayoutEffect(() => {
    if (!active) pending.current = null
  }, [active])
  const finish = useCallback(() => {
    const previous = pending.current
    pending.current = null
    previous?.save?.()
  }, [])
  const register: TPendingEdit = useCallback((id, save) => {
    const previous = pending.current
    pending.current = { id, save }
    // Selecting another transaction also completes the previous input.
    if (previous && previous.id !== id) previous.save?.()
  }, [])
  return { finish, register }
}
