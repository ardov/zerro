import { describe, expect, it, vi } from 'vitest'
import type { RootState } from 'store'
import type { TEnvelopeId } from '5-entities/envelope'
import { selectCoreEnvMetrics } from 'core-next/adapters/redux'
import { setBudget } from '5-entities/budget/setBudget'
import { sendEvent } from '6-shared/helpers/tracking'
import { copyPreviousBudget } from './index'

vi.mock('core-next/adapters/redux', () => ({
  selectCoreEnvMetrics: vi.fn(),
}))
vi.mock('5-entities/budget/setBudget', () => ({ setBudget: vi.fn() }))
vi.mock('6-shared/helpers/tracking', () => ({ sendEvent: vi.fn() }))

describe('copyPreviousBudget', () => {
  it('uses Core metrics to copy changed own budgets from the previous month', () => {
    const state = {} as RootState
    const action = { type: 'budget/set' }
    const foodId = 'tag#food' as TEnvelopeId
    const dispatch = vi.fn()

    vi.mocked(selectCoreEnvMetrics).mockReturnValue({
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
    } as unknown as ReturnType<typeof selectCoreEnvMetrics>)
    vi.mocked(setBudget).mockReturnValue(action as never)

    copyPreviousBudget('2026-07')(dispatch, () => state, undefined)

    expect(selectCoreEnvMetrics).toHaveBeenCalledWith(state)
    expect(setBudget).toHaveBeenCalledWith([
      { id: foodId, month: '2026-07', value: 100 },
    ])
    expect(dispatch).toHaveBeenCalledWith(action)
    expect(sendEvent).toHaveBeenCalledWith('Budgets: copy previous')
  })
})
