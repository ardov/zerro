import type { KeyboardEvent } from 'react'
import { useCallback, useRef } from 'react'

/** How long a typed prefix keeps accumulating before it starts over. */
const TYPEAHEAD_RESET_MS = 500

/** The keys Base UI's roving-focus containers leave to the caller.
 *
 * Its composite root handles the arrows, and it can do Home/End — but only
 * behind an option `Toolbar` does not forward. Typeahead it does not do at
 * all. Both are behaviours a list of labelled actions is expected to have,
 * so they live here rather than being pasted into each list.
 *
 * Returns a `keydown` handler for the container. It never swallows a key it
 * did not act on, so the container's own handler stays in charge.
 */
export function useRovingListKeys(itemSelector: string) {
  const search = useRef({ text: '', time: 0 })

  return useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return

      const isTypeahead = event.key.length === 1 && event.key !== ' '
      const isEdgeKey = event.key === 'Home' || event.key === 'End'
      if (!isTypeahead && !isEdgeKey) return

      const items = Array.from(
        event.currentTarget.querySelectorAll<HTMLElement>(itemSelector)
      ).filter(
        item =>
          !item.hasAttribute('disabled') &&
          item.getAttribute('aria-disabled') !== 'true'
      )
      if (!items.length) return

      if (isEdgeKey) {
        event.preventDefault()
        const target = event.key === 'Home' ? items[0] : items.at(-1)
        target?.focus()
        return
      }

      const now = performance.now()
      const key = event.key.toLocaleLowerCase()
      const previous =
        now - search.current.time < TYPEAHEAD_RESET_MS
          ? search.current.text
          : ''
      // Repeating one letter cycles through the items starting with it
      // instead of searching for a doubled prefix.
      const text = previous === key ? key : previous + key
      search.current = { text, time: now }

      const active = items.indexOf(
        event.currentTarget.ownerDocument.activeElement as HTMLElement
      )
      // A fresh single letter starts from the next item so repeats advance; a
      // longer prefix re-tests the current item so it can keep matching.
      const start = text.length > 1 ? 0 : 1
      for (let offset = start; offset <= items.length; offset++) {
        const item = items[(active + offset + items.length) % items.length]
        if (item?.textContent?.trim().toLocaleLowerCase().startsWith(text)) {
          event.preventDefault()
          item.focus()
          break
        }
      }
    },
    [itemSelector]
  )
}
