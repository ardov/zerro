import {
  Children,
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import type { Column } from './columnLayout'
import { useColumns } from './useColumns'
import './layout.css'

/** Children follow the definition's order, including conditional empty slots.
 * Each column owns its flex sizing; panels and drawers keep their own surfaces. */
export function Columns({ children }: { children: ReactNode }) {
  const layout = useColumns()
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (root.current) root.current.dataset.animate = ''
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  return (
    <div ref={root} className="layout-columns">
      {Children.map(children, (child, index) => {
        const column = layout.columns[index]
        return (
          <ColumnSlot
            column={column}
            visible={layout.visible.includes(column.id)}
          >
            {child}
          </ColumnSlot>
        )
      })}
    </div>
  )
}

function ColumnSlot({
  column,
  visible,
  children,
}: {
  column: Column
  visible: boolean
  children: ReactNode
}) {
  const [phase, setPhase] = useState({ visible, exiting: false })
  if (phase.visible !== visible) setPhase({ visible, exiting: !visible })
  const exiting = phase.exiting && !visible
  const content = useRef<HTMLDivElement>(null)
  const lastWidth = useRef(0)

  useLayoutEffect(() => {
    const element = content.current!
    if (exiting) {
      // Keep the disappearing surface readable while its flex slot collapses.
      element.style.width = `${element.offsetWidth || lastWidth.current}px`
      element.style.flex = 'none'
      let cancelled = false
      const animations = element.getAnimations()
      void Promise.allSettled(
        animations.map(animation => animation.finished)
      ).then(() => {
        if (!cancelled) setPhase({ visible: false, exiting: false })
      })
      return () => {
        cancelled = true
      }
    } else {
      element.style.removeProperty('width')
      element.style.removeProperty('flex')
      lastWidth.current = element.offsetWidth
    }
  })

  return (
    <div
      className="layout-column"
      data-visible={visible || undefined}
      inert={!visible}
      aria-hidden={!visible || undefined}
      onBlurCapture={event => {
        // Making the exiting column inert must not commit an active field.
        // Portalled drawers still need their ordinary blur/save behavior.
        if (!visible && event.currentTarget.contains(event.target))
          event.stopPropagation()
      }}
      style={
        {
          '--column-min': column.min,
          '--column-max':
            column.max === undefined ? undefined : `${column.max}px`,
        } as CSSProperties
      }
    >
      <div ref={content} className="layout-column-content">
        <RetainedContent freeze={exiting}>{children}</RetainedContent>
      </div>
    </div>
  )
}

/** Keep the same mounted editor and its docked props through the exit.
 * Once it finishes, the latest props can move that editor into its drawer. */
const RetainedContent = memo(
  function RetainedContent({
    children,
  }: {
    freeze: boolean
    children: ReactNode
  }) {
    return children
  },
  (previous, next) => next.freeze || previous.children === next.children
)
