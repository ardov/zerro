import { useEffect, useState } from 'react'

type InteractionType = 'mouse' | 'touch' | 'pen' | 'keyboard' | ''

/** The last real input, tracked once for the whole document.
 *
 * Base UI keeps the same thing for its own dismissals, but does not expose it,
 * and a surface this app closes by setting `open={false}` — Back, a call site's
 * `onClose` — emits no `openchange` at all, so the close type Base UI hands to
 * `finalFocus` is an empty string. This is the answer for those. */
let lastInteraction: InteractionType = ''

if (typeof document !== 'undefined') {
  document.addEventListener(
    'pointerdown',
    event => {
      lastInteraction =
        event.pointerType === 'touch' || event.pointerType === 'pen'
          ? event.pointerType
          : 'mouse'
    },
    true
  )
  document.addEventListener(
    'keydown',
    () => {
      lastInteraction = 'keyboard'
    },
    true
  )
}

/** Zerro overlays are controlled without a Base UI Trigger, and globally
 * hosted children may sit outside their parent's React tree. Capture the exact
 * focused control before the popup moves focus, and hand it back on exit.
 *
 * Focus returns to the control that was actually pressed, never to a surface's
 * anchor: an anchor is often the wrapper around that control, and a wrapper
 * cannot hold focus.
 *
 * The focus always returns; only its visible treatment depends on how the
 * surface was closed. Base UI asks for a ring by focusing with
 * `focusVisible: true` when it recognises a keyboard close, and otherwise
 * leaves the browser's own modality heuristic in charge — which gets it wrong
 * here, because the overlay's content is gone by then and Chrome draws a ring
 * for a scripted focus that came from nowhere. So a pointer close focuses the
 * control itself with `focusVisible: false` and tells Base UI to stand down. */
export function useOverlayFinalFocus(open: boolean) {
  // Capture before the popup commits and its autofocus moves focus. The
  // initializer also covers forms that mount already open with a fresh key.
  // Keep this opening's target through updates and exit, then capture again on
  // the next opening.
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

  // An opening starts its own modality: what closes this surface is whatever
  // happens from here on, not whatever last happened on the page before it.
  useEffect(() => {
    if (open) lastInteraction = ''
  }, [open])

  const target = opening.target

  return (closeType: InteractionType) => {
    if (!target?.isConnected) return false
    // The most recent real input is more precise than a close type inferred
    // from the focusout caused by a backdrop press. Fall back to Base UI's
    // close type when the controlled surface saw no input of its own.
    if ((lastInteraction || closeType) === 'keyboard') return target
    queueMicrotask(() =>
      target.focus({ preventScroll: true, focusVisible: false })
    )
    return false
  }
}

function getFocusedElement() {
  if (typeof document === 'undefined') return null
  const focused = document.activeElement
  return focused instanceof HTMLElement ? focused : null
}
