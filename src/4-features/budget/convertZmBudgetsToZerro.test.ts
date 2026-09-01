import { describe, expect, it, vi } from 'vitest'
import type { RootState } from '@/store'
import { core } from '@/zerro-core/redux'
import { globalBudgetTagId } from '@/6-shared/types'
import { convertZmBudgetsToZerro } from './convertZmBudgetsToZerro'

vi.mock('@/zerro-core/redux', () => ({
  core: {
    budgets: {
      selectRaw: vi.fn(),
      set: vi.fn(),
    },
    envelopes: {
      EnvType: { Tag: 'tag' },
      envId: { get: vi.fn((type, id) => `${type}#${id}`) },
    },
  },
}))

describe('convertZmBudgetsToZerro', () => {
  it('reads ZenMoney budgets and writes converted updates through Core', () => {
    const state = {} as RootState
    const action = { type: 'budget/set' }
    const dispatch = vi.fn()
    vi.mocked(core.budgets.selectRaw).mockReturnValue({
      food: { tag: 'food', date: '2026-07-01', outcome: 12_000 },
      empty: { tag: 'empty', date: '2026-07-01', outcome: 0 },
      global: {
        tag: globalBudgetTagId,
        date: '2026-07-01',
        outcome: 20_000,
      },
    } as never)
    vi.mocked(core.budgets.set).mockReturnValue(action as never)

    const updates = convertZmBudgetsToZerro()(dispatch, () => state, undefined)

    expect(core.budgets.selectRaw).toHaveBeenCalledWith(state)
    expect(core.budgets.set).toHaveBeenCalledWith([
      { id: 'tag#food', month: '2026-07', value: 12_000 },
    ])
    expect(dispatch).toHaveBeenCalledWith(action)
    expect(updates).toEqual([
      { id: 'tag#food', month: '2026-07', value: 12_000 },
    ])
  })
})
