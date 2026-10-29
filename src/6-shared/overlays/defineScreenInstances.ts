import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { useOverlayMethods, useOverlayState } from './context'

export type ScreenInstance<T> = { id: string; value: T }
export type ScreenValueUpdate<T> = T | ((previous: T) => T)

/** A repeatable Screen family. Its instance keys share the existing Screen
 * order; an entity identifier is a value, never the identity of an opening. */
export function defineScreenInstances<T>(name: string) {
  const prefix = `screen:${name}:`

  function useOpen() {
    const { openScreen } = useOverlayMethods()
    return useCallback(
      (value: T) => {
        const id = prefix + crypto.randomUUID()
        openScreen(id, value)
        return id
      },
      [openScreen]
    )
  }

  function use() {
    const { screens } = useOverlayState()
    const { updateScreen, closeScreen, removeScreen } = useOverlayMethods()
    const instances = Object.entries(screens)
      .filter(([id]) => id === name || id.startsWith(prefix))
      .map(([id, value]) => ({ id, value: value as T }))
    const setValue = useCallback(
      (id: string, update: ScreenValueUpdate<T>) => {
        updateScreen(id, previous =>
          typeof update === 'function'
            ? (update as (previous: T) => T)(previous as T)
            : update
        )
      },
      [updateScreen]
    )
    const close = useCallback(
      (id: string, options?: { through?: boolean }) => closeScreen(id, options),
      [closeScreen]
    )
    const remove = useCallback((id: string) => removeScreen(id), [removeScreen])
    return { instances, setValue, close, remove }
  }

  function useInstance(
    id: string,
    onClose?: () => void
  ): [T | undefined, (update: ScreenValueUpdate<T> | null) => void] {
    const { screens } = useOverlayState()
    const { updateScreen, closeScreen, subscribeClose } = useOverlayMethods()
    const callback = useRef(onClose)
    useLayoutEffect(() => {
      callback.current = onClose
    })
    const enabled = onClose !== undefined
    // Release passively: a Back commit can unmount this owner before the
    // host's layout notification, which still needs its latest pending input.
    useEffect(() => {
      if (!enabled) return
      return subscribeClose(id, () => callback.current?.())
    }, [id, subscribeClose, enabled])
    const set = useCallback(
      (update: ScreenValueUpdate<T> | null) => {
        if (update === null) closeScreen(id)
        else
          updateScreen(id, previous =>
            typeof update === 'function'
              ? (update as (previous: T) => T)(previous as T)
              : update
          )
      },
      [id, updateScreen, closeScreen]
    )
    return [screens[id] as T | undefined, set]
  }

  return { name, useOpen, use, useInstance }
}
