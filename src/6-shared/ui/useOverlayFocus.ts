import { useState } from 'react'

/** Capture before the popup commits and its autofocus moves focus. The
 * initializer also covers forms that mount already open with a fresh key.
 * Keep this opening's target through updates and exit, then capture again on
 * the next opening.
 *
 * Focus returns to the control that was actually pressed, never to a surface's
 * anchor: an anchor is often the wrapper around that control, and a wrapper
 * cannot hold focus. */
export function useOverlayFocus(open: boolean) {
  const [opening, setOpening] = useState(() => ({
    open,
    target: getFocusedElement(),
  }))
  if (open !== opening.open) {
    setOpening({
      open,
      target: open ? getFocusedElement() : opening.target,
    })
  }
  const target = opening.target
  return {
    finalFocus: () => (target?.isConnected ? target : true),
  }
}

function getFocusedElement() {
  if (typeof document === 'undefined') return null
  const focused = document.activeElement
  return focused instanceof HTMLElement ? focused : null
}
