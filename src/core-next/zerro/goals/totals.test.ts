import { describe, expect, it } from 'vitest'
import { EnvType, envId } from '../envelope-id'
import type { TGoalInfo } from './build'
import { buildGoalTotals } from './totals'
import { goalType } from './types'

describe('buildGoalTotals', () => {
  it('sums counted goals and skips target balance goals without deadline', () => {
    const countedId = envId.get(EnvType.Tag, 'counted')
    const skippedId = envId.get(EnvType.Tag, 'skipped')
    const result = buildGoalTotals(
      {
        '2026-01': {
          [countedId]: goalInfo({
            id: countedId,
            goal: { type: goalType.MONTHLY, amount: 100 },
            needNow: 50,
            needStart: 100,
            targetBudget: 100,
          }),
          [skippedId]: goalInfo({
            id: skippedId,
            goal: { type: goalType.TARGET_BALANCE, amount: 500 },
            needNow: 250,
            needStart: 500,
            targetBudget: 500,
          }),
        },
      },
      amount => amount.USD || 0
    )

    expect(result['2026-01']).toEqual({
      need: { USD: 50 },
      target: { USD: 100 },
      progress: 0.5,
      goalsCount: 1,
    })
  })
})

function goalInfo(patch: Partial<TGoalInfo> & { id: TGoalInfo['id'] }): TGoalInfo {
  const { id, ...rest } = patch
  return {
    id,
    goal: { type: goalType.MONTHLY, amount: 100 },
    month: '2026-01',
    currency: 'USD',
    progress: 0.5,
    needNow: 0,
    needStart: 0,
    targetBudget: 0,
    ...rest,
  }
}
