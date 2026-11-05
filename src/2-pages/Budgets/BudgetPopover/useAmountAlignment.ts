import { useRef } from 'react'
import type { PopoverSurfaceProps } from '@/6-shared/ui/kit/Popover'

/** Align the editable amount with the table's amount line box. Kept local
 * because this is a budget-table presentation, not a general popover mode. */
export function useAmountAlignment(enabled: boolean) {
  const inputRef = useRef<HTMLInputElement>(null)
  const measure = () => {
    const input = inputRef.current
    const popup = input?.closest('[role="dialog"]')
    if (!input || !popup) return null
    return {
      input: input.getBoundingClientRect(),
      popup: popup.getBoundingClientRect(),
    }
  }
  const positioning: Pick<
    PopoverSurfaceProps,
    'align' | 'sideOffset' | 'alignOffset' | 'collisionAvoidance'
  > = enabled
    ? {
        align: 'end',
        sideOffset: ({ anchor }) => {
          const rects = measure()
          if (!rects) return 0
          return (
            -anchor.height / 2 -
            (rects.input.top + rects.input.height / 2 - rects.popup.top)
          )
        },
        alignOffset: () => {
          const rects = measure()
          // End offsets run inward; measuring includes the actual addon width.
          return rects ? rects.input.right - rects.popup.right : 0
        },
        collisionAvoidance: { side: 'shift', align: 'shift' },
      }
    : { align: 'start' }
  return {
    inputRef,
    positioning,
    controlClassName: enabled ? 'text-right' : undefined,
  }
}
