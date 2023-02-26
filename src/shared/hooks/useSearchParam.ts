import { useCallback } from 'react'
import { useHistory } from 'react-router'

export function useSearchParam<T extends string>(
  key: string,
  method: 'push' | 'replace' = 'replace'
) {
  const history = useHistory()
  let value = new URLSearchParams(history.location.search).get(key) as T | null
  if (value) value = decodeURIComponent(value) as T
  const setValue = useCallback(
    (id?: T | null) => history[method](getModifiedPath(key, id)),
    [history, key, method]
  )
  return [value, setValue] as [T | null, (id?: T | null) => void]
}

function getModifiedPath(key: string, value?: string | null) {
  const url = new URL(window.location.href)
  url.searchParams.delete(key)
  if (value) url.searchParams.append(key, value)
  return url.pathname + url.hash + url.search
}
