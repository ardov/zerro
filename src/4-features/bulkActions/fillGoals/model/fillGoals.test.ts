import { describe, expect, it, vi } from 'vitest'
import type { RootState } from 'store'
import type { TEnvelopeId } from '5-entities/envelope'
import { selectCoreGoals } from 'core-next/adapters/redux'
import { goalType } from 'core-next/zerro/goals'
import { setTotalBudget } from '4-features/budget/setTotalBudget'
import { sendEvent } from '6-shared/helpers/tracking'
import { fillGoals } from './fillGoals'

vi.mock('core-next/adapters/redux', () => ({
  selectCoreGoals: vi.fn(),
}))
vi.mock('4-features/budget/setTotalBudget', () => ({
  setTotalBudget: vi.fn(),
}))
vi.mock('6-shared/helpers/tracking', () => ({ sendEvent: vi.fn() }))

describe('fillGoals', () => {
  it('uses Core goals and skips fulfilled and endless target-balance goals', () => {
    const state = {} as RootState
    const monthlyId = 'tag#monthly' as TEnvelopeId
    const endlessId = 'tag#endless' as TEnvelopeId
    const fulfilledId = 'tag#fulfilled' as TEnvelopeId
    const action = { type: 'budget/total' }
    const dispatch = vi.fn()

    vi.mocked(selectCoreGoals).mockReturnValue({
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
    } as unknown as ReturnType<typeof selectCoreGoals>)
    vi.mocked(setTotalBudget).mockReturnValue(action as never)

    fillGoals('2026-07')(dispatch, () => state, undefined)

    expect(selectCoreGoals).toHaveBeenCalledWith(state)
    expect(setTotalBudget).toHaveBeenCalledWith([
      { id: monthlyId, month: '2026-07', value: 100 },
    ])
    expect(dispatch).toHaveBeenCalledWith(action)
    expect(sendEvent).toHaveBeenCalledWith('Budgets: fill goals')
  })
})
