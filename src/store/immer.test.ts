import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { afterEach, describe, expect, it } from 'vitest'
import { configureImmer } from './immer'

const slice = createSlice({
  name: 'snapshot',
  initialState: { rows: {} as Record<string, { title: string }> },
  reducers: {
    replace: (
      state,
      action: PayloadAction<Record<string, { title: string }>>
    ) => {
      state.rows = action.payload
    },
  },
})

function storeRows() {
  return slice.reducer(
    undefined,
    slice.actions.replace({ cash: { title: 'Cash' } })
  ).rows
}

afterEach(() => configureImmer(false))

describe('configureImmer', () => {
  it('leaves stored snapshots unfrozen in production', () => {
    configureImmer(true)
    const rows = storeRows()
    expect(Object.isFrozen(rows)).toBe(false)
    expect(Object.isFrozen(rows.cash)).toBe(false)
  })

  it('keeps freezing them elsewhere, so mutations still fail loudly', () => {
    configureImmer(false)
    const rows = storeRows()
    expect(Object.isFrozen(rows)).toBe(true)
    expect(Object.isFrozen(rows.cash)).toBe(true)
  })
})
