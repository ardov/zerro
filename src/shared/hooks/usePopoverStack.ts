import { History, Location } from 'history'
import { useEffect, useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'

export const popoverStack = {
  useActions,
  useStack,
  useState: useOpenState,
}

type TLocationState = { dialogs?: string[] }

function useActions(): {
  open: (key: string) => void
  close: (key: string) => void
}
function useActions(defaultKey: string): {
  open: () => void
  close: () => void
}
function useActions(defaultKey?: string) {
  const history = useHistory<TLocationState>()
  return useMemo(
    () => ({
      open: (key = defaultKey) =>
        show(history, defaultKey || (typeof key === 'string' ? key : '')),
      close: (key = defaultKey) =>
        hide(history, defaultKey || (typeof key === 'string' ? key : '')),
    }),
    [defaultKey, history]
  )
}

function useStack() {
  const history = useHistory<TLocationState>()
  const [stack, setStack] = useState(getStack(history.location))
  const { open, close } = useActions()

  // Update stack whenever location changes
  useEffect(() => {
    return history.listen(location => {
      const newStack = getStack(location)
      setStack(prevStack =>
        prevStack.toString() === newStack.toString() ? prevStack : newStack
      )
    })
  }, [history])

  return [stack, open, close] as [string[], typeof open, typeof close]
}

function useOpenState(key: string) {
  const history = useHistory<TLocationState>()
  const [opened, setOpened] = useState(isOpen(key, history.location))
  const { open, close } = useActions(key)

  // Subscribe to history updates
  useEffect(
    () => history.listen(location => setOpened(isOpen(key, location))),
    [history, key]
  )

  return [opened, open, close] as [boolean, typeof open, typeof close]
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

function show(history: History<TLocationState>, key: string) {
  if (!key) return
  const currStack = getStack(history.location)

  if (currStack.includes(key)) return // Do nothing if already visible

  const { pathname, hash, search, state = {} } = history.location
  let nextState = { ...state, dialogs: [...currStack, key] } // add key
  history.push(pathname + hash + search, nextState)
}

function hide(history: History<TLocationState>, key: string) {
  if (!key) return
  const stack = getStack(history.location)
  const lastIndex = stack.indexOf(key)
  if (lastIndex === -1) return
  history.go(lastIndex - stack.length)
}
