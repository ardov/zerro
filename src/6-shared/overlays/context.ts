import type { ReactElement } from 'react'
import { createContext, useContext } from 'react'

/** Everything that opens or closes an overlay. Stable for the life of the
 * host, so a caller can hold one in a `useCallback` without it going stale. */
export type OverlayMethods = {
  openPopup: (id: string) => void
  closePopup: (id: string) => void
  ask: <T>(element: ReactElement) => Promise<T | undefined>
  openScreen: (name: string, value: unknown, instead?: boolean) => void
  closeScreen: (name: string) => void
}

export const OverlayMethodsContext = createContext<OverlayMethods | null>(null)

export type OverlayState = {
  /** Ids of the popup layers alive right now, in opening order. */
  live: readonly string[]
  /** Open screens and their values, read back from the history entry. */
  screens: Record<string, unknown>
}

export const OverlayStateContext = createContext<OverlayState>({
  live: [],
  screens: {},
})

export function useOverlayMethods() {
  const methods = useContext(OverlayMethodsContext)
  if (!methods) throw new Error('Overlays are used outside of <OverlayHost>')
  return methods
}

export function useOverlayState() {
  return useContext(OverlayStateContext)
}

/** What an element handed to `ask` is given. */
export type AskedLayer = {
  /** False while the surface is animating out, so it can play its exit. */
  open: boolean
  answer: (value?: unknown) => void
}

export const AskedContext = createContext<AskedLayer | null>(null)
