import { describe, expect, it } from 'vitest'
import {
  makeFxConverter,
  makeGoalInfo,
} from '../../../../support/testing/zerroTestData'
import { EnvType, envId } from '../envelope-id'
import { buildGoalTotals } from './totals'
import { goalType } from './types'

describe('buildGoalTotals', () => {
  it('shows a half-funded goal at 50% when both converted amounts are below a cent', () => {
    const id = envId.get(EnvType.Tag, 'project')
    const result = buildGoalTotals(
      {
        '2026-01': {
          [id]: makeGoalInfo({
            id,
            currency: 'DASH',
            goal: { type: goalType.MONTHLY, amount: 0.02 },
            targetBudget: 0.02,
            needStart: 0.02,
            needNow: 0.01,
          }),
        },
      },
      makeFxConverter({ USD: 1, DASH: 0.00004 })
    )
    expect(result['2026-01'].progress).toBe(0.5)
  })

  it('includes a foreign goal worth less than a cent in the combined progress', () => {
    const funded = envId.get(EnvType.Tag, 'funded')
    const open = envId.get(EnvType.Tag, 'open')
    const result = buildGoalTotals(
      {
        '2026-01': {
          [funded]: makeGoalInfo({
            id: funded,
            currency: 'USD',
            needStart: 0.01,
            needNow: 0,
            targetBudget: 0.01,
          }),
          [open]: makeGoalInfo({
            id: open,
            currency: 'DASH',
            needStart: 50,
            needNow: 50,
            targetBudget: 50,
          }),
        },
      },
      makeFxConverter({ USD: 1, DASH: 0.00004 })
    )
    expect(result['2026-01'].progress).toBe(0.83)
  })

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
