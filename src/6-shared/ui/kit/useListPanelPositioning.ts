import type { CSSProperties } from 'react'
import { useVisualViewport } from '../useVisualViewport'

/** Margin the panel keeps from every visible edge.
 *
 * Base UI applies it as collision padding, and the panel reads it back through
 * `--list-panel-margin` to cap its own height. Both have to be the same number:
 * in the aligned mode Base UI sizes the positioner from its own margins, and a
 * panel that capped itself differently would fight that. */
export const listPanelMargin = 16

/** Base UI alone positions the panel; the shared reader supplies its boundary. */
export function useListPanelPositioning() {
  const viewport = useVisualViewport()
  return {
    positionMethod: 'fixed',
    side: 'bottom',
    align: 'start',
    sideOffset: 4,
    collisionPadding: listPanelMargin,
    collisionBoundary: viewport
      ? {
          x: viewport.left,
          y: viewport.top,
          width: viewport.width,
          height: viewport.height,
        }
      : undefined,
    sticky: true,
    collisionAvoidance: { side: 'shift', align: 'shift' },
    // The positioner wraps the panel, so this cascades into it.
    style: {
      '--list-panel-margin': `${listPanelMargin}px`,
    } as CSSProperties,
  } as const
}
