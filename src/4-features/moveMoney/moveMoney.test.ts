import { describe, expect, it, vi } from 'vitest'
import type { RootState } from '@/store'
import { core } from '@/zerro-core/redux'

import { track } from '@/6-shared/analytics'
import { moveMoney } from './moveMoney'

vi.mock('@/zerro-core/redux', () => ({
  core: {
    activity: { selectEnvelopeMetrics: vi.fn() },
    currency: { selectConvertFx: vi.fn() },
    budgets: { set: vi.fn() },
  },
}))
vi.mock('@/6-shared/analytics', () => ({ track: vi.fn() }))

describe('moveMoney', () => {
  it('uses Core metrics and converts the destination budget to its currency', () => {
    const state = {} as RootState
    const action = { type: 'budget/set' }
    const source = 'tag#source' as core.envelopes.TEnvelopeId
    const destination = 'tag#destination' as core.envelopes.TEnvelopeId
    const convertFx = vi.fn(() => 9)
    const dispatch = vi.fn()

    vi.mocked(core.activity.selectEnvelopeMetrics).mockReturnValue({
      '2026-07': {
        [source]: {
          id: source,
          currency: 'USD',
          selfAssigned: { USD: 100 },
        },
        [destination]: {
          id: destination,
          currency: 'EUR',
          selfAssigned: { EUR: 50 },
        },
      },
    } as unknown as ReturnType<typeof core.activity.selectEnvelopeMetrics>)
    vi.mocked(core.currency.selectConvertFx).mockReturnValue(convertFx)
    vi.mocked(core.budgets.set).mockReturnValue(action as never)

    moveMoney(
      10,
      'USD',
      source,
      destination,
      '2026-07'
    )(dispatch, () => state, undefined)

    expect(core.activity.selectEnvelopeMetrics).toHaveBeenCalledWith(state)
    expect(convertFx).toHaveBeenCalledWith({ USD: 10 }, 'EUR', '2026-07')
    expect(core.budgets.set).toHaveBeenCalledWith([
      { id: source, month: '2026-07', value: 90 },
      { id: destination, month: '2026-07', value: 59 },
    ])
    expect(dispatch).toHaveBeenCalledWith(action)
    expect(track).toHaveBeenCalledWith('budget_funds_moved', {})
  })
})
