import { useSyncExternalStore } from 'react'

const stores = new Map<
  string,
  {
    subscribe: (listener: () => void) => () => void
    getSnapshot: () => boolean
  }
>()

const noopStore = {
  subscribe: () => () => {},
  getSnapshot: () => false,
}

function getStore(query: string) {
  if (typeof window === 'undefined') return noopStore
  const existing = stores.get(query)
  if (existing) return existing
  // One MediaQueryList per query, shared by every caller: creating one per
  // render would allocate on every pass through a component.
  const media = window.matchMedia(query)
  const store = {
    subscribe: (listener: () => void) => {
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    },
    getSnapshot: () => media.matches,
  }
  stores.set(query, store)
  return store
}

const getServerSnapshot = () => false

/** Whether a media query matches.
 *
 * For application layout breakpoints use `useBreakpointDown`. This hook also
 * supports media features and component-specific layout policies; keep each
 * shared policy in one named hook rather than repeating its query in callers. */
export function useMediaQueryValue(query: string) {
  const { subscribe, getSnapshot } = getStore(query)
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
