import type { CSSProperties } from 'react'
import { useVisualViewport } from '../useVisualViewport'

/** Share the collision margin with the panel's CSS height cap so aligned geometry and CSS agree. */
export const listPanelMargin = 16

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
    style: {
      '--list-panel-margin': `${listPanelMargin}px`,
    } as CSSProperties,
  } as const
}
