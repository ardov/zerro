import { useCallback } from 'react'
import { useHistory, useLocation } from 'react-router'

function getModifiedPath(key: string, value?: string | null) {
  const url = new URL(window.location.href)
  url.searchParams.delete(key)
  if (value) url.searchParams.append(key, value)
  const path = url.pathname + url.search
  return path
}

export function useSearchParam<T extends string>(
  key: string
): [T | null, (id?: T | null) => void] {
  const history = useHistory()
  const location = useLocation()
  let value = new URLSearchParams(location.search).get(key) as T | null
  if (value) value = decodeURIComponent(value) as T
  const setValue = useCallback(
    (id?: T | null) => {
      history.push(getModifiedPath(key, id))
    },
    [history, key]
  )
  return [value, setValue]
}
