import { describe, expect, it } from 'vitest'
import { resolveColumns } from '@/6-shared/ui/layout/columnLayout'
import { pageColumns } from './pageColumns'

describe('page columns', () => {
  it.each([
    [1112, pageColumns.transactions, ['accounts', 'transactions', 'detail']],
    [1111, pageColumns.transactions, ['accounts', 'transactions']],
    [744, pageColumns.transactions, ['accounts', 'transactions']],
    [743, pageColumns.transactions, ['transactions']],
    [1272, pageColumns.budget, ['accounts', 'envelopes', 'overview']],
    [1271, pageColumns.budget, ['envelopes', 'overview']],
    [984, pageColumns.budget, ['envelopes', 'overview']],
    [983, pageColumns.budget, ['envelopes']],
  ])(
    'selects columns by their minima at %ipx',
    (width, definition, visible) => {
      const layout = resolveColumns(width, definition, false)
      expect(layout.visible).toEqual(visible)
      const used = layout.visible.reduce(
        (sum, id) => sum + layout.sizes[id] + 8,
        layout.sizes.rail
      )
      expect(used).toBeCloseTo(width)
    }
  )
})
