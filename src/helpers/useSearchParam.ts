import { useCallback } from 'react'
import { useHistory, useLocation } from 'react-router'

function getModifiedPath(key: string, value?: string | null) {
  const url = new URL(window.location.href)
  url.searchParams.delete(key)
  if (value) url.searchParams.append(key, value)
  const path = url.pathname + url.search
  return path
}

export function useSearchParam(
  key: string
): [string | null, (id?: string | null) => void] {
  const history = useHistory()
  const location = useLocation()
  const value = new URLSearchParams(location.search).get(key)
  const setValue = useCallback(
    (id?: string | null) => {
      history.push(getModifiedPath(key, id))
    },
    [history, key]
  )
  return [value, setValue]
}
