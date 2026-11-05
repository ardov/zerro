import { createContext, useContext } from 'react'
import type { resolveColumns } from './columnLayout'

export const ColumnsContext = createContext<ReturnType<
  typeof resolveColumns
> | null>(null)

/** The shell selects visible columns; CSS distributes their widths. */
export function useColumns() {
  const layout = useContext(ColumnsContext)
  if (!layout) throw new Error('Columns require the application layout')
  return layout
}
