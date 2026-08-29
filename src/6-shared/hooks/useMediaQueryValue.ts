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

/** Whether a media query matches, without legacy UI.
 *
 * For breakpoints reach for `useBreakpointDown` instead — it takes a key from
 * the one map legacy UI and Tailwind are also built from, so a component never
 * spells a breakpoint out. This one is for the queries that are not
 * breakpoints at all: colour scheme, device metrics. */
export function useMediaQueryValue(query: string) {
  const { subscribe, getSnapshot } = getStore(query)
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
