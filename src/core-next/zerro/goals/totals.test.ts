import { describe, expect, it } from 'vitest'
import { makeGoalInfo } from '../../testing/zerroTestData'
import { EnvType, envId } from '../envelope-id'
import { buildGoalTotals } from './totals'
import { goalType } from './types'

describe('buildGoalTotals', () => {
  it('sums counted goals and skips target balance goals without deadline', () => {
    const countedId = envId.get(EnvType.Tag, 'counted')
    const skippedId = envId.get(EnvType.Tag, 'skipped')
    const result = buildGoalTotals(
      {
        '2026-01': {
          [countedId]: makeGoalInfo({
            id: countedId,
            goal: { type: goalType.MONTHLY, amount: 100 },
            needNow: 50,
            needStart: 100,
            targetBudget: 100,
          }),
          [skippedId]: makeGoalInfo({
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
