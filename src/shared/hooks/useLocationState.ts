import { History, Location } from 'history'
import { useCallback, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'

type TLocationState = { dialogs?: string[] }

export function useLocationState(key: string) {
  const history = useHistory<TLocationState>()
  const [isOpen, setOpen] = useState(isVisible(history.location, key))

  // Update an open state whenever location changes
  useEffect(() => {
    const unregister = history.listen((location, action) => {
      setOpen(isVisible(location, key))
    })
    return unregister
  }, [history, key])

  const open = useCallback(() => show(history, key), [history, key])
  const close = useCallback(() => hide(history, key), [history, key])
  return [isOpen, open, close] as [boolean, typeof open, typeof close]
}

//
// Helpers
//

function getStack(location: Location) {
  return (location?.state as TLocationState)?.dialogs || []
}

function isVisible(location: Location, key: string) {
  return getStack(location).indexOf(key) !== -1
}

function show(history: History, key: string) {
  if (!key) return
  let newState = {
    ...((history?.location?.state as TLocationState) || {}),
  }
  newState.dialogs = [...getStack(history.location)]
  newState.dialogs.push(key)
  const { pathname, hash, search } = history.location
  history.push(pathname + hash + search, newState)
}

function hide(history: History, key: string) {
  const stack = getStack(history.location)
  const lastIndex = stack.lastIndexOf(key)
  if (lastIndex === -1) return
  history.go(lastIndex - stack.length)
}
