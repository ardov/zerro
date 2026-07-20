import { describe, expect, it, vi } from 'vitest'
import type { RootState } from 'store'
import type { TEnvelopeId } from '5-entities/envelope'
import { core } from 'zerro-core/redux'

import { track } from '6-shared/analytics'
import { copyPreviousBudget } from './index'

vi.mock('zerro-core/redux', () => ({
  core: {
    activity: { selectEnvelopeMetrics: vi.fn() },
    budgets: { set: vi.fn() },
  },
}))
vi.mock('6-shared/analytics', () => ({ track: vi.fn() }))

describe('copyPreviousBudget', () => {
  it('uses Core metrics to copy changed own budgets from the previous month', () => {
    const state = {} as RootState
    const action = { type: 'budget/set' }
    const foodId = 'tag#food' as TEnvelopeId
    const dispatch = vi.fn()

    vi.mocked(core.activity.selectEnvelopeMetrics).mockReturnValue({
      '2026-06': {
        [foodId]: {
          id: foodId,
          currency: 'USD',
          selfBudgeted: { USD: 100 },
        },
      },
      '2026-07': {
        [foodId]: {
          id: foodId,
          currency: 'USD',
          selfBudgeted: { USD: 50 },
        },
      },
    } as unknown as ReturnType<typeof core.activity.selectEnvelopeMetrics>)
    vi.mocked(core.budgets.set).mockReturnValue(action as never)

    copyPreviousBudget('2026-07')(dispatch, () => state, undefined)

    expect(core.activity.selectEnvelopeMetrics).toHaveBeenCalledWith(state)
    expect(core.budgets.set).toHaveBeenCalledWith([
      { id: foodId, month: '2026-07', value: 100 },
    ])
    expect(dispatch).toHaveBeenCalledWith(action)
    expect(track).toHaveBeenCalledWith('budget_automation_applied', {
      automation: 'copy_previous',
    })
  })
})
