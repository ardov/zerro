import { useState } from 'react'

/** Freeze the last open value while a surface animates out. */
export function useCachedValue<T>(value: T, clock: boolean): T {
  const [cachedValue, setCachedValue] = useState(value)
  if (clock && cachedValue !== value) setCachedValue(value)
  return cachedValue
}
