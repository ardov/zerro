import { useCallback } from 'react'
import { useOverlayMethods, useOverlayState } from './context'

/** Declares an overlay a person can come back to.
 *
 * A screen is described entirely by its value, so it can be rebuilt from the
 * address alone: Back, Forward and a reload all restore it. The value lives in
 * the history entry, which means it must be plain data — an id, or an object
 * of ids. A callback in there would make the screen unrestorable, and then it
 * is not a screen (R3).
 *
 * Values ride in the invisible half of the address for now. Moving one into
 * the browser's address bar is a later, separate change per screen, and only
 * where a shareable link is worth having. */
export function defineScreen<T>(name: string) {
  // Open screens are held in one object and their order is that object's key
  // order, which puts integer-like keys first whatever the insertion order.
  // Such a name would silently sink to the bottom of the stack, so it is
  // refused outright rather than debugged later.
  if (import.meta.env.DEV && String(Number(name)) === name)
    throw new Error(`Screen name "${name}" must not read as a number`)

  /** Like `useState`, except the state lives in the address: `set(null)`
   * closes, Back does the same, and a reload loses nothing. */
  function use(): [T | undefined, (value: T | null) => void] {
    const { screens } = useOverlayState()
    const { openScreen, closeScreen } = useOverlayMethods()
    const set = useCallback(
      (value: T | null) =>
        value === null || value === undefined
          ? closeScreen(name)
          : openScreen(name, value),
      [openScreen, closeScreen]
    )
    return [screens[name] as T | undefined, set]
  }

  /** Opens it from anywhere. */
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

  /** Reads it without the setter, for a surface that only draws. */
  function useValue(): T | undefined {
    return useOverlayState().screens[name] as T | undefined
  }

  return { name, use, useOpen, useOpenInstead, useValue }
}
