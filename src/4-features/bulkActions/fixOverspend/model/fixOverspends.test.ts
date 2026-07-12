import { describe, expect, it, vi } from 'vitest'
import type { RootState } from 'store'
import type { TEnvelopeId } from '5-entities/envelope'
import { selectCoreEnvMetrics } from 'zerro-core/redux'
import { setTotalBudget } from '4-features/budget/setTotalBudget'
import { sendEvent } from '6-shared/helpers/tracking'
import { fixOverspends } from './fixOverspends'

vi.mock('zerro-core/redux', () => ({
  selectCoreEnvMetrics: vi.fn(),
}))
vi.mock('4-features/budget/setTotalBudget', () => ({
  setTotalBudget: vi.fn(),
}))
vi.mock('6-shared/helpers/tracking', () => ({ sendEvent: vi.fn() }))

describe('fixOverspends', () => {
  it('uses Core metrics for child and parent overspends', () => {
    const state = {} as RootState
    const childId = 'tag#child' as TEnvelopeId
    const parentId = 'tag#parent' as TEnvelopeId
    const dispatch = vi.fn((action: unknown) => {
      if (typeof action === 'function') {
        return action(dispatch, () => state, undefined)
      }
      return action
    })

    vi.mocked(selectCoreEnvMetrics).mockReturnValue({
      '2026-07': {
        [childId]: {
          id: childId,
          parent: parentId,
          currency: 'USD',
          selfBudgeted: { USD: 100 },
          selfAvailable: { USD: -20 },
        },
        [parentId]: {
          id: parentId,
          parent: null,
          currency: 'USD',
          totalBudgeted: { USD: 100 },
          totalAvailable: { USD: -30 },
          selfAvailable: { USD: -5 },
        },
      },
    } as unknown as ReturnType<typeof selectCoreEnvMetrics>)
    vi.mocked(setTotalBudget).mockImplementation(
      updates => ({ type: 'budget/total', payload: updates }) as never
    )

    fixOverspends('2026-07')(dispatch, () => state, undefined)

    expect(selectCoreEnvMetrics).toHaveBeenCalledTimes(2)
    expect(setTotalBudget).toHaveBeenNthCalledWith(1, [
      { id: childId, month: '2026-07', value: 120 },
    ])
    expect(setTotalBudget).toHaveBeenNthCalledWith(2, [
      { id: parentId, month: '2026-07', value: 130 },
    ])
    expect(sendEvent).toHaveBeenCalledWith('Budgets: fix overspends')
  })
})
