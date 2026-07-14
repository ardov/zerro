import { describe, expect, it, vi } from 'vitest'
import type { RootState } from 'store'
import type { TEnvelopeId } from '5-entities/envelope'
import { goals as coreGoals } from 'zerro-core/redux'

import { goalType } from 'zerro-core/domain/zerro/goals'
import { setTotalBudget } from '4-features/budget/setTotalBudget'
import { track } from '6-shared/analytics'
import { fillGoals } from './fillGoals'

vi.mock('zerro-core/redux', async importOriginal => {
  const actual = await importOriginal<typeof import('zerro-core/redux')>()
  return {
    ...actual,
    goals: { ...actual.goals, selectAll: vi.fn() },
  }
})
vi.mock('4-features/budget/setTotalBudget', () => ({
  setTotalBudget: vi.fn(),
}))
vi.mock('6-shared/analytics', () => ({ track: vi.fn() }))

describe('fillGoals', () => {
  it('uses Core goals and skips fulfilled and endless target-balance goals', () => {
    const state = {} as RootState
    const monthlyId = 'tag#monthly' as TEnvelopeId
    const endlessId = 'tag#endless' as TEnvelopeId
    const fulfilledId = 'tag#fulfilled' as TEnvelopeId
    const action = { type: 'budget/total' }
    const dispatch = vi.fn()

    vi.mocked(coreGoals.selectAll).mockReturnValue({
      '2026-07': {
        [monthlyId]: {
          id: monthlyId,
          goal: { type: goalType.MONTHLY, amount: 100 },
          needNow: 10,
          targetBudget: 100,
        },
        [endlessId]: {
          id: endlessId,
          goal: { type: goalType.TARGET_BALANCE, amount: 500 },
          needNow: 100,
          targetBudget: 500,
        },
        [fulfilledId]: {
          id: fulfilledId,
          goal: { type: goalType.MONTHLY_SPEND, amount: 200 },
          needNow: 0,
          targetBudget: 200,
        },
      },
    } as unknown as ReturnType<typeof coreGoals.selectAll>)
    vi.mocked(setTotalBudget).mockReturnValue(action as never)

    fillGoals('2026-07')(dispatch, () => state, undefined)

    expect(coreGoals.selectAll).toHaveBeenCalledWith(state)
    expect(setTotalBudget).toHaveBeenCalledWith([
      { id: monthlyId, month: '2026-07', value: 100 },
    ])
    expect(dispatch).toHaveBeenCalledWith(action)
    expect(track).toHaveBeenCalledWith('budget_automation_applied', {
      automation: 'fill_goals',
    })
  })
})
