import type { OverlayController } from './controller'
import { useCloseNotification } from './useCloseNotification'
import { useContext } from 'react'
import { AskedContext, useOverlayMethods } from './context'

/** Ask builds a popup with its current inputs. Dismissal always settles the promise with undefined. */
export function useAsk() {
  return useOverlayMethods().ask
}

/** The first explicit answer wins. History or surface close lets onClose submit a draft; technical unmount does not. */
export function useAsked<T>(onClose?: (answer: (value?: T) => void) => void): {
  open: boolean
  answer: (value?: T) => void
  controller: OverlayController
} {
  const layer = useContext(AskedContext)
  if (!layer) throw new Error('useAsked is used outside of an asked overlay')
  useCloseNotification(
    layer.controller,
    onClose ? () => onClose(layer.answer) : undefined
  )
  return layer as {
    open: boolean
    answer: (value?: T) => void
    controller: OverlayController
  }
}
