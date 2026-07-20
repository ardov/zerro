import { describe, expect, it } from 'vitest'
import type { TGoalContext } from './progress'
import { calcGoals } from './progress'
import type { TGoal } from './types'
import { goalType } from './types'

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
    // Negative budget never dips below zero
    expect(calc({ ...context, budgeted: -10 })).toBe(0)
    // Overshoot clamps to 1, near-complete clamps down to 0.99
    expect(calc({ ...context, budgeted: 120 })).toBe(1)
    expect(calc({ ...context, budgeted: 99.99 })).toBe(0.99)
  })

  it('calculates monthly spend progress relative to leftover', () => {
    const calc = getProgress({ type: goalType.MONTHLY_SPEND, amount: 100 })

    // Without leftover it behaves like a monthly save goal
    expect(calc({ ...context, leftover: 0, budgeted: 0 })).toBe(0)
    expect(calc({ ...context, leftover: 0, budgeted: 10 })).toBe(0.1)
    expect(calc({ ...context, leftover: 0, budgeted: 100 })).toBe(1)
    // Positive leftover reduces what still needs budgeting
    expect(calc({ ...context, leftover: 100, budgeted: 0 })).toBe(1)
    expect(calc({ ...context, leftover: 50, budgeted: 10 })).toBe(0.2)
    // Negative leftover raises the bar
    expect(calc({ ...context, leftover: -100, budgeted: 50 })).toBe(0.25)
    expect(calc({ ...context, leftover: -100, budgeted: 200 })).toBe(1)
  })

  it('calculates income percent progress', () => {
    const calc = getProgress({ type: goalType.INCOME_PERCENT, amount: 0.5 })

    expect(calc({ ...context, generalIncome: 100, budgeted: 0 })).toBe(0)
    expect(calc({ ...context, generalIncome: 100, budgeted: 25 })).toBe(0.5)
    expect(calc({ ...context, generalIncome: 100, budgeted: 50 })).toBe(1)
    // No income means nothing left to save, so the goal reads as complete
    expect(calc({ ...context, generalIncome: 0, budgeted: 0 })).toBe(1)
    expect(calc({ ...context, generalIncome: 0, budgeted: -20 })).toBe(0)
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
    // Overspent envelopes stay at zero progress
    expect(calc({ ...context, available: -50 })).toBe(0)
  })
})

const getProgress = (goal: TGoal) => (ctx: TGoalContext) =>
  calcGoals[goal.type](goal, ctx).progress
