export type Column = {
  id: string
  /** Selection minimum, flex basis and proportional growth weight. */
  min: number
  /** Omit for unlimited growth; equal min and max fixes the width. */
  max?: number
  /** Lower numbers disappear first. Omit on exactly one column: the primary. */
  collapseOrder?: number
}

export type Columns = readonly Column[]

/** Width is the available content area, after navigation and safe areas.
 * Select columns at minimum widths; CSS owns their actual sizes. */
export function resolveColumns(
  width: number,
  definition: Columns | undefined,
  mobile: boolean
) {
  const columns = definition ?? []
  const primaryColumns = columns.filter(c => c.collapseOrder === undefined)
  if (definition && primaryColumns.length !== 1)
    throw new Error('A column layout requires exactly one primary column')
  const primary = primaryColumns[0]?.id
  let visible = columns.filter(c => !mobile || c.id === primary)
  const gap = mobile ? 0 : 8
  const minimum = () => visible.reduce((sum, c) => sum + c.min + gap, 0)
  const removable = visible
    .filter(c => c.id !== primary)
    .sort((a, b) => a.collapseOrder! - b.collapseOrder!)
  for (const column of removable) {
    if (minimum() <= width) break
    visible = visible.filter(c => c !== column)
  }

  return { mobile, columns, visible: visible.map(c => c.id) }
}
