import { Location } from 'history'
import { useCallback, useEffect, useState } from 'react'
import { useHistory } from 'react-router'

type TUpdateMethod = 'push' | 'replace'

export function useSearchParam<T extends string>(
  key: string,
  defaultMethod: TUpdateMethod = 'replace'
) {
  const history = useHistory()
  const [val, setVal] = useState<T | null>(getParam<T>(history.location, key))

  useEffect(
    () => history.listen(location => setVal(getParam<T>(location, key))),
    [history, key]
  )

  const setValue = useCallback(
    (value?: T | null, method: TUpdateMethod = defaultMethod) =>
      history[method](getModifiedPath(key, value), history.location.state),
    [history, key, defaultMethod]
  )

  return [val, setValue] as [T | null, (value?: T | null) => void]
}

function getParam<T extends string>(location: Location, key: string) {
  const value = new URLSearchParams(location.search).get(key)
  return value ? (decodeURIComponent(value) as T) : null
}

function getModifiedPath(key: string, value?: string | null) {
  const url = new URL(window.location.href)
  url.searchParams.delete(key)
  if (value) url.searchParams.append(key, value)
  return url.pathname + url.hash + url.search
}
