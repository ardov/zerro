import { useEffect, useState } from 'react'
import {
  forgetLastInteraction,
  getLastInteraction,
  type InteractionType,
} from './inputModality'

/** Capture the focused opener before hosted content moves focus. Use quiet focus after a pointer close so Chrome does not show a ring. */
export function useOverlayFinalFocus(
  open: boolean,
  {
    fallback = false,
    target: getTarget,
  }: { fallback?: boolean; target?: () => HTMLElement | null } = {}
) {
  // Capture each opening before autofocus, including a fresh mount; keep that target through exit.
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
    if (open) forgetLastInteraction()
  }, [open])

  return (closeType: InteractionType) => {
    // A list can replace its selected Details without reopening them. In that
    // case the latest row, rather than the first one, is the return target.
    const target = getTarget ? getTarget() : opening.target
    // An action menu may disappear after opening another surface. Let that
    // surface use Base UI's restoration chain when explicitly enabled.
    if (!target?.isConnected) return fallback
    // Prefer the latest real input over Base UI's inferred close type, which can misread a backdrop press.
    if ((getLastInteraction() || closeType) === 'keyboard') return target
    queueMicrotask(() =>
      target.focus({ preventScroll: true, focusVisible: false })
    )
    return false
  }
}

function getFocusedElement() {
  if (typeof document === 'undefined') return null
  const focused = document.activeElement
  return focused instanceof HTMLElement && focused !== document.body
    ? focused
    : null
}
