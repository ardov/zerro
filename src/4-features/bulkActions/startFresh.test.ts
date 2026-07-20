import { describe, expect, it, vi } from 'vitest'
import type { RootState } from 'store'
import type { TEnvelopeId } from '5-entities/envelope'
import { core } from 'zerro-core/redux'

import { setTotalBudget } from '4-features/budget/setTotalBudget'
import { track } from '6-shared/analytics'
import { startFresh } from './startFresh'

vi.mock('zerro-core/redux', () => ({
  core: {
    activity: { selectEnvelopeMetrics: vi.fn() },
  },
}))
vi.mock('4-features/budget/setTotalBudget', () => ({
  setTotalBudget: vi.fn(),
}))
vi.mock('6-shared/analytics', () => ({ track: vi.fn() }))

describe('startFresh', () => {
  it('uses Core metrics for both resets and future-budget cleanup', () => {
    const state = {} as RootState
    const childId = 'tag#child' as TEnvelopeId
    const parentId = 'tag#parent' as TEnvelopeId
    const futureId = 'tag#future' as TEnvelopeId
    const dispatch = vi.fn((action: unknown) => {
      if (typeof action === 'function') {
        return action(dispatch, () => state, undefined)
      }
      return action
    })

    vi.mocked(core.activity.selectEnvelopeMetrics).mockReturnValue({
      '2026-06': makeMonth(childId, parentId),
      '2026-07': makeMonth(childId, parentId),
      '2026-08': {
        [futureId]: {
          id: futureId,
          selfBudgeted: { USD: 50 },
        },
      },
    } as unknown as ReturnType<typeof core.activity.selectEnvelopeMetrics>)
    vi.mocked(setTotalBudget).mockImplementation(
      updates => ({ type: 'budget/total', payload: updates }) as never
    )

    startFresh('2026-07')(dispatch, () => state, undefined)

    expect(core.activity.selectEnvelopeMetrics).toHaveBeenCalledTimes(5)
    expect(setTotalBudget).toHaveBeenNthCalledWith(1, [
      { id: childId, month: '2026-06', value: 90 },
    ])
    expect(setTotalBudget).toHaveBeenNthCalledWith(2, [
      { id: parentId, month: '2026-06', value: 180 },
    ])
    expect(setTotalBudget).toHaveBeenNthCalledWith(3, [
      { id: childId, month: '2026-07', value: 90 },
    ])
    expect(setTotalBudget).toHaveBeenNthCalledWith(4, [
      { id: parentId, month: '2026-07', value: 180 },
    ])
    expect(setTotalBudget).toHaveBeenNthCalledWith(5, [
      { id: futureId, month: '2026-08', value: 0 },
    ])
    expect(track).toHaveBeenCalledWith('budget_automation_applied', {
      automation: 'start_fresh',
    })
  })
})

function makeMonth(childId: TEnvelopeId, parentId: TEnvelopeId) {
  return {
    [childId]: {
      id: childId,
      parent: parentId,
      currency: 'USD',
      selfAvailable: { USD: 10 },
      totalBudgeted: { USD: 100 },
    },
    [parentId]: {
      id: parentId,
      parent: null,
      currency: 'USD',
      selfAvailable: { USD: 20 },
      totalBudgeted: { USD: 200 },
    },
  }
}
