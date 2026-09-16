import type { OverlayController } from './controller'
import { useCloseNotification } from './useCloseNotification'
import { useContext } from 'react'
import { AskedContext, useOverlayMethods } from './context'

/** Opens a popup and waits for its answer.
 *
 * Everything that appears "from somewhere" — a confirmation, a colour picker,
 * a context menu — is a question. The caller asks it and reads the answer,
 * instead of handing the popup a callback and losing sight of it:
 *
 * ```tsx
 * const ask = useAsk()
 * if (!(await ask(<Confirm title={t('deleteTitle')} />))) return
 * ```
 *
 * The element is built at the moment of the call, with real props, so the
 * invented defaults and `if (!transaction) return null` guards a globally
 * mounted popup needs are gone.
 *
 * It always answers. Back, a click outside, Escape, leaving the page, the host
 * itself going away — every one of them resolves, with `undefined` for "no
 * answer". A pending `await` is never left hanging. */
export function useAsk() {
  return useOverlayMethods().ask
}

/** The asked element owns its draft and subscription; surfaces only render it.
 * answer() without a value dismisses the question. */
export function useAsked<T>(onClose?: () => void): {
  open: boolean
  answer: (value?: T) => void
  controller: OverlayController
} {
  const layer = useContext(AskedContext)
  if (!layer) throw new Error('useAsked is used outside of an asked overlay')
  useCloseNotification(layer.controller, onClose)
  return layer as {
    open: boolean
    answer: (value?: T) => void
    controller: OverlayController
  }
}
