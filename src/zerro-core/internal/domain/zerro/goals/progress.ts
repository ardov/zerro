import { differenceInCalendarMonths, toISOMonth } from '../../foundation/date'
import { round } from '../../foundation/numbers'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TGoal } from './types'
import { goalType } from './types'

type GoalProgress = {
  progress: number
  needStart: number
  needNow: number
  targetBudget: number
}

export type TGoalContext = {
  month: TISOMonth
  leftover: number
  budgeted: number
  available: number
  generalIncome: number
}

export const calcGoals = {
  [goalType.MONTHLY]: (goal: TGoal, context: TGoalContext): GoalProgress => {
    const { budgeted } = context
    const needStart = goal.amount
    const needNow = Math.max(round(needStart - budgeted), 0)

    return {
      needStart,
      needNow,
      targetBudget: needStart,
      progress: getProgress(needStart, needNow),
    }
  },

  [goalType.MONTHLY_SPEND]: (
    goal: TGoal,
    context: TGoalContext
  ): GoalProgress => {
    const { budgeted, leftover } = context
    const { amount } = goal
    const needStart = Math.max(round(amount - leftover), 0)
    const needNow = Math.max(round(amount - leftover - budgeted), 0)

    return {
      needStart,
      needNow,
      targetBudget: needStart,
      progress: getProgress(needStart, needNow),
    }
  },

  [goalType.INCOME_PERCENT]: (
    goal: TGoal,
    context: TGoalContext
  ): GoalProgress => {
    const { generalIncome, budgeted } = context
    const percent = clamp(goal.amount, 0, 1)
    const needStart = Math.max(round(generalIncome * percent), 0)
    const needNow = Math.max(round(needStart - budgeted), 0)

    return {
      needStart,
      needNow,
      targetBudget: needStart,
      progress: getProgress(needStart, needNow),
    }
  },

  [goalType.TARGET_BALANCE]: (
    goal: TGoal,
    context: TGoalContext
  ): GoalProgress => {
    const { amount, end } = goal

    if (!end) {
      const { leftover, available } = context
      const needNow = Math.max(round(amount - available), 0)
      const needStart = Math.max(round(amount - leftover), 0)
      return {
        needStart,
        needNow,
        targetBudget: needStart,
        progress: getProgress(amount, needNow),
      }
    }

    const { budgeted, leftover, month } = context
    const endMonth = toISOMonth(end)
    if (month > endMonth) throw new Error('currentMonth > endMonth')

    const monthsLeft = differenceInCalendarMonths(endMonth, month) + 1
    const needStart = Math.max(round((amount - leftover) / monthsLeft), 0)
    const needNow =
      round(leftover + budgeted) >= amount
        ? 0
        : Math.max(round(needStart - budgeted), 0)

    return {
      needStart,
      needNow,
      targetBudget: needStart,
      progress: getProgress(needStart, needNow),
    }
  },
}

export function getProgress(needStart: number, needNow: number): number {
  if (needStart < 0) needStart = 0
  if (needNow <= 0) return 1
  if (needNow >= needStart) return 0

  const progress = round(1 - needNow / needStart)
  if (progress >= 1) return 0.99
  return progress
}

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max)
}
