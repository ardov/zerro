import { useCallback, useEffect, useRef } from 'react'
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
  const hitoryRef = useRef(history)

  useEffect(() => {
    hitoryRef.current = history
  }, [history])

  let value = new URLSearchParams(location.search).get(key) as T | null
  if (value) value = decodeURIComponent(value) as T
  const setValue = useCallback(
    (id?: T | null) => {
      hitoryRef.current.push(getModifiedPath(key, id))
    },
    [hitoryRef, key]
  )
  return [value, setValue]
}
