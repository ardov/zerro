import type { KeyboardEvent } from 'react'

/** Unhandled keyboard input without command modifiers or IME composition.
 * Typeahead allows Shift so uppercase letters remain searchable. */
export function isPlainKey(event: KeyboardEvent, allowShift = false) {
  return !(
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    (!allowShift && event.shiftKey) ||
    event.nativeEvent.isComposing
  )
}
