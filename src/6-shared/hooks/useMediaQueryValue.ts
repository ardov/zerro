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

/** For shared application breakpoints use useBreakpointDown; keep other shared queries in a named hook. */
export function useMediaQueryValue(query: string) {
  const { subscribe, getSnapshot } = getStore(query)
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
