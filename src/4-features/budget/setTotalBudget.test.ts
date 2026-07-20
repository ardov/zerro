import { describe, expect, it, vi } from 'vitest'
import type { RootState } from 'store'
import * as core from 'zerro-core/redux'

import type { TEnvelopeId } from '5-entities/envelope'
import { setTotalBudget } from './setTotalBudget'

vi.mock('zerro-core/redux', () => ({
  activity: { selectEnvelopeMetrics: vi.fn() },
  currency: { selectConvertFx: vi.fn() },
  budgets: { set: vi.fn() },
}))

describe('setTotalBudget', () => {
  it('uses Core metrics to convert a total budget into an own budget', () => {
    const state = {} as RootState
    const action = { type: 'budget/set' }
    const convertFx = vi.fn(() => 12)
    const dispatch = vi.fn()
    const foodId = 'tag#food' as TEnvelopeId

    vi.mocked(core.activity.selectEnvelopeMetrics).mockReturnValue({
      '2026-07': {
        [foodId]: {
          childrenBudgeted: { EUR: 10 },
          currency: 'USD',
        },
      },
    } as unknown as ReturnType<typeof core.activity.selectEnvelopeMetrics>)
    vi.mocked(core.currency.selectConvertFx).mockReturnValue(convertFx)
    vi.mocked(core.budgets.set).mockReturnValue(action as never)

    setTotalBudget({ id: foodId, month: '2026-07', value: 100 })(
      dispatch,
      () => state,
      undefined
    )

    expect(core.activity.selectEnvelopeMetrics).toHaveBeenCalledWith(state)
    expect(convertFx).toHaveBeenCalledWith({ EUR: 10 }, 'USD', '2026-07')
    expect(core.budgets.set).toHaveBeenCalledWith([
      { id: foodId, month: '2026-07', value: 88 },
    ])
    expect(dispatch).toHaveBeenCalledWith(action)
  })
})
