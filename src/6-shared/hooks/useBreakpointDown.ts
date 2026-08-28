import { useSyncExternalStore } from 'react'
import type { TBreakpointDown } from '6-shared/ui/theme/breakpoints'
import { mediaQueryDown } from '6-shared/ui/theme/breakpoints'

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

/** True below the given breakpoint, matching MUI's `breakpoints.down`. */
export function useBreakpointDown(key: TBreakpointDown) {
  const { subscribe, getSnapshot } = getStore(mediaQueryDown(key))
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
