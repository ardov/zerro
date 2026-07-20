import type { Location } from 'react-router-dom'
import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * A set of hooks for managing a stack of popovers/dialogs in the history state.
 * - `useStack` returns the current stack of open dialogs and actions to open/close them.
 * - `useState` returns the open state of a single dialog and actions to open/close it.
 * - `useActions` returns actions to open/close a single dialog.
 */
export const popoverStack = {
  useActions,
  usePopoverStack,
  usePopoverState,
}

export type TKey = string

type TLocationState = { dialogs?: TKey[] }

function useActions(): {
  open: (key: TKey) => void
  close: (key: TKey) => void
} {
  const location = useLocation()
  const navigate = useNavigate()
  return useMemo(
    () => ({
      open: (key: TKey) => {
        if (!key) return
        const currStack = getStack(location)
        if (currStack.includes(key)) return // Do nothing if already visible
        const { pathname, hash, search } = location
        const state = getState(location)
        const nextState = { ...state, dialogs: [...currStack, key] } // add key
        navigate(pathname + search + hash, { state: nextState })
      },
      close: (key: TKey) => {
        if (!key) return
        const stack = getStack(location)
        const lastIndex = stack.indexOf(key)
        if (lastIndex === -1) return
        navigate(lastIndex - stack.length)
      },
    }),
    [location, navigate]
  )
}

/**
 * Returns the current stack of open dialogs.
 */
export function usePopoverStack() {
  return getStack(useLocation())
}

/**
 * Returns the open state of a single dialog.
 * @param key Dialog key
 * @returns [opened, open, close]
 * - `opened` - whether the dialog is currently open
 * - `open` - function to open the dialog
 * - `close` - function to close the dialog
 * @example
 * const [opened, open, close] = useOpenState('my-dialog')
 * return (
 *  <Dialog open={opened} onClose={close}>
 *   ...
 * </Dialog>
 * )
 */
function usePopoverState(key: TKey): [boolean, () => void, () => void] {
  const location = useLocation()
  const { open, close } = useActions()

  const openPopover = useCallback(() => open(key), [key, open])
  const closePopover = useCallback(() => close(key), [key, close])

  return [isOpen(key, location), openPopover, closePopover]
}

//
// =============================================================================
// Helpers
// =============================================================================
//

function isOpen(key: string, location: Location) {
  return getStack(location).includes(key)
}

function getStack(location: Location) {
  return getState(location).dialogs || []
}

function getState(location: Location): TLocationState {
  return typeof location.state === 'object' && location.state
    ? (location.state as TLocationState)
    : {}
}
