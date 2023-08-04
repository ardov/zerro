import { toISOMonth } from '6-shared/helpers/date'
import { describe, expect, test } from 'vitest'
import { calcGoals, TContext } from './calcGoals'
import { goalType, TGoal } from './types'

const ctx = {
  month: toISOMonth(new Date()),
  leftover: 0,
  budgeted: 0,
  available: 0,
  generalIncome: 0,
}

const getProgress = (goal: TGoal) => (ctx: TContext) =>
  calcGoals[goal.type](goal, ctx).progress

describe('goal', () => {
  test('Monthly save goal', () => {
    let calc = getProgress({ type: goalType.MONTHLY, amount: 100 })
    expect(calc({ ...ctx, budgeted: 0 })).toBe(0)
    expect(calc({ ...ctx, budgeted: 10 })).toBe(0.1)
    expect(calc({ ...ctx, budgeted: -10 })).toBe(0)
    expect(calc({ ...ctx, budgeted: 100 })).toBe(1)
    expect(calc({ ...ctx, budgeted: 120 })).toBe(1)
  })

  test('Monthly spend goal', () => {
    let calc = getProgress({ type: goalType.MONTHLY_SPEND, amount: 100 })
    // Without leftover same as monthly save
    expect(calc({ ...ctx, leftover: 0, budgeted: 0 })).toBe(0)
    expect(calc({ ...ctx, leftover: 0, budgeted: 10 })).toBe(0.1)
    expect(calc({ ...ctx, leftover: 0, budgeted: -10 })).toBe(0)
    expect(calc({ ...ctx, leftover: 0, budgeted: 100 })).toBe(1)
    expect(calc({ ...ctx, leftover: 0, budgeted: 120 })).toBe(1)
    // With big leftover
    expect(calc({ ...ctx, leftover: 100, budgeted: 0 })).toBe(1)
    expect(calc({ ...ctx, leftover: 100, budgeted: 10 })).toBe(1)
    expect(calc({ ...ctx, leftover: 150, budgeted: -10 })).toBe(1)
    expect(calc({ ...ctx, leftover: 150, budgeted: -50 })).toBe(1)
    expect(calc({ ...ctx, leftover: 150, budgeted: -100 })).toBe(0)
    // With leftover
    expect(calc({ ...ctx, leftover: 50, budgeted: 0 })).toBe(0)
    expect(calc({ ...ctx, leftover: 50, budgeted: 10 })).toBe(0.2)
    expect(calc({ ...ctx, leftover: 50, budgeted: -10 })).toBe(0)
    expect(calc({ ...ctx, leftover: 50, budgeted: 50 })).toBe(1)
    expect(calc({ ...ctx, leftover: 50, budgeted: 120 })).toBe(1)
    // With negative
    expect(calc({ ...ctx, leftover: -100, budgeted: 0 })).toBe(0)
    expect(calc({ ...ctx, leftover: -100, budgeted: 10 })).toBe(0.05)
    expect(calc({ ...ctx, leftover: -100, budgeted: -10 })).toBe(0)
    expect(calc({ ...ctx, leftover: -100, budgeted: 50 })).toBe(0.25)
    expect(calc({ ...ctx, leftover: -100, budgeted: 200 })).toBe(1)
    expect(calc({ ...ctx, leftover: -100, budgeted: 250 })).toBe(1)
  })

  test('Income percent', () => {
    let calc = getProgress({ type: goalType.INCOME_PERCENT, amount: 0.5 })
    expect(calc({ ...ctx, generalIncome: 100, budgeted: 0 })).toBe(0)
    expect(calc({ ...ctx, generalIncome: 100, budgeted: -20 })).toBe(0)
    expect(calc({ ...ctx, generalIncome: 100, budgeted: 25 })).toBe(0.5)
    expect(calc({ ...ctx, generalIncome: 100, budgeted: 50 })).toBe(1)
    expect(calc({ ...ctx, generalIncome: 100, budgeted: 100 })).toBe(1)
    // No income
    expect(calc({ ...ctx, generalIncome: 0, budgeted: 0 })).toBe(1)
    expect(calc({ ...ctx, generalIncome: 0, budgeted: -20 })).toBe(0)
    expect(calc({ ...ctx, generalIncome: 0, budgeted: 25 })).toBe(1)
    expect(calc({ ...ctx, generalIncome: 0, budgeted: 50 })).toBe(1)
    expect(calc({ ...ctx, generalIncome: 0, budgeted: 100 })).toBe(1)
  })

  test('Tagret balance with date', () => {
    let calc = getProgress({
      type: goalType.TARGET_BALANCE,
      amount: 100,
      end: '2022-12-01',
    })
    let ctx2: TContext = { ...ctx, month: '2022-11' }
    // Leftover 0 (need 50)
    expect(calc({ ...ctx2, leftover: 0, budgeted: 0 })).toBe(0)
    expect(calc({ ...ctx2, leftover: 0, budgeted: -20 })).toBe(0)
    expect(calc({ ...ctx2, leftover: 0, budgeted: 25 })).toBe(0.5)
    expect(calc({ ...ctx2, leftover: 0, budgeted: 50 })).toBe(1)
    expect(calc({ ...ctx2, leftover: 0, budgeted: 150 })).toBe(1)
    // Leftover 50 (need 25)
    expect(calc({ ...ctx2, leftover: 50, budgeted: 0 })).toBe(0)
    expect(calc({ ...ctx2, leftover: 50, budgeted: -20 })).toBe(0)
    expect(calc({ ...ctx2, leftover: 50, budgeted: 5 })).toBe(0.2)
    expect(calc({ ...ctx2, leftover: 50, budgeted: 25 })).toBe(1)
    expect(calc({ ...ctx2, leftover: 50, budgeted: 150 })).toBe(1)
    // Leftover 100 (completed)
    expect(calc({ ...ctx2, leftover: 100, budgeted: 0 })).toBe(1)
    expect(calc({ ...ctx2, leftover: 100, budgeted: -20 })).toBe(0)
    expect(calc({ ...ctx2, leftover: 120, budgeted: -20 })).toBe(1)
    expect(calc({ ...ctx2, leftover: 160, budgeted: -20 })).toBe(1)
    expect(calc({ ...ctx2, leftover: 100, budgeted: 10 })).toBe(1)
    // Leftover -100 (need 100)
    expect(calc({ ...ctx2, leftover: -100, budgeted: 0 })).toBe(0)
    expect(calc({ ...ctx2, leftover: -100, budgeted: 50 })).toBe(0.5)
    expect(calc({ ...ctx2, leftover: -100, budgeted: 100 })).toBe(1)
    expect(calc({ ...ctx2, leftover: -100, budgeted: 120 })).toBe(1)
  })

  test('Tagret balance without date', () => {
    let calc = getProgress({ type: goalType.TARGET_BALANCE, amount: 100 })
    // Already completed
    expect(calc({ ...ctx, available: 100, budgeted: 0 })).toBe(1)
    expect(calc({ ...ctx, available: 100, budgeted: -20 })).toBe(1)
    expect(calc({ ...ctx, available: 100, budgeted: 25 })).toBe(1)
    expect(calc({ ...ctx, available: 100, budgeted: 100 })).toBe(1)
    expect(calc({ ...ctx, available: 100, budgeted: 150 })).toBe(1)
    // 0 available
    expect(calc({ ...ctx, available: 0, budgeted: 0 })).toBe(0)
    expect(calc({ ...ctx, available: 0, budgeted: -20 })).toBe(0)
    expect(calc({ ...ctx, available: 0, budgeted: 25 })).toBe(0)
    expect(calc({ ...ctx, available: 0, budgeted: 100 })).toBe(0)
    expect(calc({ ...ctx, available: 0, budgeted: 150 })).toBe(0)
    // Half completed
    expect(calc({ ...ctx, available: 50, budgeted: 0 })).toBe(0.5)
    expect(calc({ ...ctx, available: 50, budgeted: -20 })).toBe(0.5)
    expect(calc({ ...ctx, available: 50, budgeted: 25 })).toBe(0.5)
    expect(calc({ ...ctx, available: 50, budgeted: 100 })).toBe(0.5)
    expect(calc({ ...ctx, available: 50, budgeted: 150 })).toBe(0.5)
    // With overspend
    expect(calc({ ...ctx, available: -50, budgeted: 0 })).toBe(0)
    expect(calc({ ...ctx, available: -50, budgeted: -20 })).toBe(0)
    expect(calc({ ...ctx, available: -50, budgeted: 25 })).toBe(0)
    expect(calc({ ...ctx, available: -50, budgeted: 100 })).toBe(0)
    expect(calc({ ...ctx, available: -50, budgeted: 150 })).toBe(0)
  })
})
