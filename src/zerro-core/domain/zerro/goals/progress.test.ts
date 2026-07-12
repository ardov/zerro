import { describe, expect, it } from 'vitest'
import { calcGoals, TGoalContext } from './progress'
import { goalType, TGoal } from './types'

const context: TGoalContext = {
  month: '2026-01',
  leftover: 0,
  budgeted: 0,
  available: 0,
  generalIncome: 0,
}

describe('calcGoals', () => {
  it('calculates monthly contribution progress', () => {
    const calc = getProgress({ type: goalType.MONTHLY, amount: 100 })

    expect(calc({ ...context, budgeted: 0 })).toBe(0)
    expect(calc({ ...context, budgeted: 25 })).toBe(0.25)
    expect(calc({ ...context, budgeted: 100 })).toBe(1)
  })

  it('calculates income percent progress', () => {
    const calc = getProgress({ type: goalType.INCOME_PERCENT, amount: 0.5 })

    expect(calc({ ...context, generalIncome: 100, budgeted: 0 })).toBe(0)
    expect(calc({ ...context, generalIncome: 100, budgeted: 25 })).toBe(0.5)
    expect(calc({ ...context, generalIncome: 100, budgeted: 50 })).toBe(1)
  })

  it('calculates target balance with deadline', () => {
    const progress = calcGoals[goalType.TARGET_BALANCE](
      { type: goalType.TARGET_BALANCE, amount: 120, end: '2026-03-01' },
      { ...context, month: '2026-01', leftover: 0, budgeted: 20 }
    )

    expect(progress.needStart).toBe(40)
    expect(progress.needNow).toBe(20)
    expect(progress.targetBudget).toBe(40)
    expect(progress.progress).toBe(0.5)
  })

  it('calculates target balance without deadline from availability', () => {
    const calc = getProgress({ type: goalType.TARGET_BALANCE, amount: 100 })

    expect(calc({ ...context, available: 0 })).toBe(0)
    expect(calc({ ...context, available: 50 })).toBe(0.5)
    expect(calc({ ...context, available: 100 })).toBe(1)
  })
})

const getProgress = (goal: TGoal) => (ctx: TGoalContext) =>
  calcGoals[goal.type](goal, ctx).progress
