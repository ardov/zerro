import type { Location } from 'history'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'

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
  const history = useHistory<TLocationState>()
  return useMemo(
    () => ({
      open: (key: TKey) => {
        if (!key) return
        const currStack = getStack(history.location)
        if (currStack.includes(key)) return // Do nothing if already visible
        const { pathname, hash, search, state = {} } = history.location
        let nextState = { ...state, dialogs: [...currStack, key] } // add key
        history.push(pathname + hash + search, nextState)
      },
      close: (key: TKey) => {
        if (!key) return
        const stack = getStack(history.location)
        const lastIndex = stack.indexOf(key)
        if (lastIndex === -1) return
        history.go(lastIndex - stack.length)
      },
    }),
    [history]
  )
}

/**
 * Returns the current stack of open dialogs.
 */
export function usePopoverStack() {
  const history = useHistory<TLocationState>()
  const [stack, setStack] = useState(getStack(history.location))
  // Update stack whenever location changes
  useEffect(() => {
    const unlisten = history.listen(location => {
      const newStack = getStack(location)
      setStack(prevStack =>
        prevStack.toString() === newStack.toString() ? prevStack : newStack
      )
    })
    return unlisten
  }, [history])
  return stack as TKey[]
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
  const history = useHistory<TLocationState>()
  const [opened, setOpened] = useState(isOpen(key, history.location))
  const { open, close } = useActions()

  const openPopover = useCallback(() => open(key), [key, open])
  const closePopover = useCallback(() => close(key), [key, close])

  // Subscribe to history updates
  useEffect(
    () => history.listen(location => setOpened(isOpen(key, location))),
    [history, key]
  )

  return [opened, openPopover, closePopover]
}

//
// =============================================================================
// Helpers
// =============================================================================
//

function isOpen(key: string, location: Location<TLocationState>) {
  return Boolean(location?.state?.dialogs?.includes(key))
}

function getStack(location: Location<TLocationState>) {
  return location?.state?.dialogs || []
}
