import { History, Location } from 'history'
import { useCallback, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'

type TLocationState = { dialogs?: string[] }

export function usePopoverStack() {
  const history = useHistory<TLocationState>()
  const [stack, setStack] = useState(getStack(history.location))

  // Update stack whenever location changes
  useEffect(() => {
    const unregister = history.listen((location, action) => {
      const newStack = getStack(location)
      setStack(prevStack =>
        prevStack.toString() === newStack.toString() ? prevStack : newStack
      )
    })
    return unregister
  }, [history])

  const open = useCallback((key: string) => show(history, key), [history])
  const close = useCallback((key: string) => hide(history, key), [history])
  return [stack, open, close] as [string[], typeof open, typeof close]
}

//
// =============================================================================
// Helpers
// =============================================================================
//

function getStack(location: Location<TLocationState>) {
  return location?.state?.dialogs || []
}

function show(history: History<TLocationState>, key: string) {
  if (!key) return
  const currStack = getStack(history.location)

  // Do nothing if already visible
  if (currStack.includes(key)) return

  const { pathname, hash, search, state = {} } = history.location
  let nextState = { ...state }
  nextState.dialogs = [...currStack]
  nextState.dialogs.push(key)
  history.push(pathname + hash + search, nextState)
}

function hide(history: History<TLocationState>, key: string) {
  const stack = getStack(history.location)
  const lastIndex = stack.lastIndexOf(key)
  if (lastIndex === -1) return
  history.go(lastIndex - stack.length)
}
