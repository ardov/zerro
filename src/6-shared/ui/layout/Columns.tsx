import type { ReactNode } from 'react'
import { useColumns } from './useColumns'
import './layout.css'

export function Columns({ children }: { children: ReactNode }) {
  const layout = useColumns()
  return (
    <div
      className="layout-columns"
      style={{
        gridTemplateColumns: layout.mobile
          ? 'minmax(0, 1fr)'
          : layout.visible.map(id => `${layout.sizes[id]}px`).join(' '),
      }}
    >
      {children}
    </div>
  )
}
