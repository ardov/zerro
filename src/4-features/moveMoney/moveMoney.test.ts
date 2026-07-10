import { describe, expect, it, vi } from 'vitest'
import type { RootState } from 'store'
import type { TEnvelopeId } from '5-entities/envelope'
import { selectCoreEnvMetrics } from 'core-next/adapters/redux'
import { budgetModel } from '5-entities/budget'
import { fxRateModel } from '5-entities/currency/fxRate'
import { sendEvent } from '6-shared/helpers/tracking'
import { moveMoney } from './moveMoney'

vi.mock('core-next/adapters/redux', () => ({
  selectCoreEnvMetrics: vi.fn(),
}))
vi.mock('5-entities/budget', () => ({
  budgetModel: { set: vi.fn() },
}))
vi.mock('5-entities/currency/fxRate', () => ({
  fxRateModel: { converter: vi.fn() },
}))
vi.mock('6-shared/helpers/tracking', () => ({ sendEvent: vi.fn() }))

describe('moveMoney', () => {
  it('uses Core metrics and converts the destination budget to its currency', () => {
    const state = {} as RootState
    const action = { type: 'budget/set' }
    const source = 'tag#source' as TEnvelopeId
    const destination = 'tag#destination' as TEnvelopeId
    const convertFx = vi.fn(() => 9)
    const dispatch = vi.fn()

    vi.mocked(selectCoreEnvMetrics).mockReturnValue({
      '2026-07': {
        [source]: {
          id: source,
          currency: 'USD',
          selfBudgeted: { USD: 100 },
        },
        [destination]: {
          id: destination,
          currency: 'EUR',
          selfBudgeted: { EUR: 50 },
        },
      },
    } as unknown as ReturnType<typeof selectCoreEnvMetrics>)
    vi.mocked(fxRateModel.converter).mockReturnValue(convertFx)
    vi.mocked(budgetModel.set).mockReturnValue(action as never)

    moveMoney(10, 'USD', source, destination, '2026-07')(
      dispatch,
      () => state,
      undefined
    )

    expect(selectCoreEnvMetrics).toHaveBeenCalledWith(state)
    expect(convertFx).toHaveBeenCalledWith({ USD: 10 }, 'EUR', '2026-07')
    expect(budgetModel.set).toHaveBeenCalledWith([
      { id: source, month: '2026-07', value: 90 },
      { id: destination, month: '2026-07', value: 59 },
    ])
    expect(dispatch).toHaveBeenCalledWith(action)
    expect(sendEvent).toHaveBeenCalledWith('Budgets: move funds')
  })
})
