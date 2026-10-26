import { describe, expect, it } from 'vitest'
import { resolveColumns } from '@/6-shared/ui/layout/columnLayout'
import { pageColumns } from './pageColumns'

describe('page columns', () => {
  it.each([
    [1064, pageColumns.transactions, ['accounts', 'transactions', 'detail']],
    [1063, pageColumns.transactions, ['accounts', 'transactions']],
    [696, pageColumns.transactions, ['accounts', 'transactions']],
    [695, pageColumns.transactions, ['transactions']],
    [1224, pageColumns.budget, ['accounts', 'envelopes', 'overview']],
    [1223, pageColumns.budget, ['envelopes', 'overview']],
    [936, pageColumns.budget, ['envelopes', 'overview']],
    [935, pageColumns.budget, ['envelopes']],
  ])(
    'selects columns by their minima at %ipx of content width',
    (width, definition, visible) => {
      const layout = resolveColumns(width, definition, false)
      expect(layout.visible).toEqual(visible)
    }
  )
})
