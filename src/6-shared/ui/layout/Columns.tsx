import { Children, type ReactNode } from 'react'
import { useColumns } from './useColumns'
import './layout.css'

/** Children follow the definition's order, including conditional empty slots.
 * Each column owns its flex sizing; panels and drawers keep their own surfaces. */
export function Columns({ children }: { children: ReactNode }) {
  const layout = useColumns()
  return (
    <div className="layout-columns">
      {Children.map(children, (child, index) => {
        if (!child) return null
        const column = layout.columns[index]
        return (
          <div
            className="layout-column"
            hidden={!layout.visible.includes(column.id)}
            style={
              layout.mobile
                ? { flex: 1 }
                : {
                    flex: `${column.min} 1 ${column.min}px`,
                    maxWidth: column.max,
                  }
            }
          >
            {child}
          </div>
        )
      })}
    </div>
  )
}
