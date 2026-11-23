import { useCallback } from 'react'
import { useOverlayMethods, useOverlayState } from './context'
import { useScreenClose } from './useScreenClose'

/** Screen values must be serializable so Back, Forward, and reload can reconstruct them. */
export function defineScreen<T>(name: string) {
  // Integer-like keys sort before other keys, so they cannot preserve opening order.
  if (import.meta.env.DEV && String(Number(name)) === name)
    throw new Error(`Screen name "${name}" must not read as a number`)

  /** Set null to close. Register onClose above the conditionally mounted surface. */
  function use(
    onClose?: () => void
  ): [T | undefined, (value: T | null) => void] {
    const { screens } = useOverlayState()
    const { openScreen, closeScreen } = useOverlayMethods()
    const set = useCallback(
      (value: T | null) =>
        value === null || value === undefined
          ? closeScreen(name)
          : openScreen(name, value),
      [openScreen, closeScreen]
    )
    useScreenClose(name, onClose)
    return [screens[name] as T | undefined, set]
  }

  function useOpen() {
    const { openScreen } = useOverlayMethods()
    return useCallback((value: T) => openScreen(name, value), [openScreen])
  }

  /** Opens it in place of the screen that is open now, rather than on top of
   * it — for a screen that hands over its place instead of keeping it. */
  function useOpenInstead() {
    const { openScreen } = useOverlayMethods()
    return useCallback(
      (value: T) => openScreen(name, value, true),
      [openScreen]
    )
  }

  /** Remove an unavailable entity even when a child Screen is above it. */
  function useRemove() {
    const { removeScreen } = useOverlayMethods()
    return useCallback(() => removeScreen(name), [removeScreen])
  }

  function useValue(): T | undefined {
    return useOverlayState().screens[name] as T | undefined
  }

  return { name, use, useOpen, useOpenInstead, useValue, useRemove }
}
