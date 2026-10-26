export type Column = {
  id: string
  min: number
  /** Omit for unlimited growth; equal min and max fixes the width. */
  max?: number
  /** Lower numbers disappear first. Omit on exactly one column: the primary. */
  collapseOrder?: number
}

export type Columns = readonly Column[]

export const layoutGeometry = {
  railMin: 48,
  railMax: 56,
  gap: 8,
} as const

/** Select at minimum widths first, then share extra space equally between
 * growing elements. The rail participates in exactly the same distribution. */
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
  const gap = mobile ? 0 : layoutGeometry.gap
  const railMin = mobile ? 0 : layoutGeometry.railMin
  const minimum = () =>
    railMin + visible.reduce((sum, c) => sum + c.min + gap, 0)
  const removable = visible
    .filter(c => c.id !== primary)
    .sort((a, b) => a.collapseOrder! - b.collapseOrder!)
  for (const column of removable) {
    if (minimum() <= width) break
    visible = visible.filter(c => c !== column)
  }

  const sizes: Record<string, number> = Object.fromEntries(
    visible.map(c => [c.id, c.min])
  )
  sizes.rail = railMin
  const free = width - minimum()
  if (free < 0 && primary !== undefined)
    sizes[primary] = Math.max(0, sizes[primary] + free)
  let remaining = Math.max(0, free)
  let growing = [
    ...(!mobile ? [{ id: 'rail', max: layoutGeometry.railMax }] : []),
    ...visible,
  ].filter(c => sizes[c.id] < (c.max ?? Infinity))
  while (remaining > 0 && growing.length) {
    const share = remaining / growing.length
    let used = 0
    for (const column of growing) {
      const addition = Math.min(
        share,
        (column.max ?? Infinity) - sizes[column.id]
      )
      sizes[column.id] += addition
      used += addition
    }
    remaining = Math.max(0, remaining - used)
    growing = growing.filter(c => sizes[c.id] < (c.max ?? Infinity))
  }
  return { mobile, sizes, visible: visible.map(c => c.id) }
}
