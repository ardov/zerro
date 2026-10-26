import { describe, expect, it } from 'vitest'
import { resolveColumns, type Columns } from './columnLayout'

describe('column selection', () => {
  const columns: Columns = [
    { id: 'aside', min: 200, max: 240, collapseOrder: 1 },
    { id: 'main', min: 560 },
    { id: 'detail', min: 360, max: 360, collapseOrder: 0 },
  ]

  it('retains the primary even when its minimum exceeds available width', () => {
    expect(resolveColumns(100, columns, false).visible).toEqual(['main'])
  })

  it('selects only the primary in mobile mode', () => {
    expect(resolveColumns(1400, columns, true).visible).toEqual(['main'])
  })
})
