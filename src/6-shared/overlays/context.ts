import type { OverlayController } from './controller'
import type { ReactElement } from 'react'
import { createContext, useContext } from 'react'

/** Everything that opens or closes an overlay. Stable for the life of the
 * host, so a caller can hold one in a `useCallback` without it going stale. */
export type OverlayMethods = {
  back: () => boolean
  subscribeClose: (id: string, listener: () => void) => () => void
  openPopup: (id: string) => void
  closePopup: (id: string, notify?: boolean) => void
  ask: <T>(element: ReactElement) => Promise<T | undefined>
  openScreen: (name: string, value: unknown, instead?: boolean) => void
  closeScreen: (name: string, options?: { through?: boolean }) => void
  removeScreen: (name: string) => void
  updateScreen: (name: string, update: (value: unknown) => unknown) => void
}

export const OverlayMethodsContext = createContext<OverlayMethods | null>(null)

export type OverlayState = {
  live: readonly string[]
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

export type AskedLayer = {
  open: boolean
  answer: (value?: unknown) => void
  controller: OverlayController
}

export const AskedContext = createContext<AskedLayer | null>(null)
