import { useState } from 'react'

/**
 * Updates value only when clock is true.
 * Used inside modals to prevent re-renders while animating it out.
 */
export function useCachedValue<T>(value: T, clock: boolean): T {
  const [cachedValue, setCachedValue] = useState(value)
  if (clock && cachedValue !== value) setCachedValue(value)
  return cachedValue
}
