import { TISOMonth } from '6-shared/types'
import { round } from '6-shared/helpers/money'
import { goalType, TGoal } from './types'
import { differenceInCalendarMonths, toISOMonth } from '6-shared/helpers/date'

type GoalProgress = {
  progress: number
  needStart: number
  needNow: number
  targetBudget: number
}

export type TContext = {
  month: TISOMonth
  leftover: number
  budgeted: number
  available: number
  generalIncome: number
}

export const calcGoals = {
  [goalType.MONTHLY]: (goal: TGoal, context: TContext): GoalProgress => {
    // "I want to save 1000$ every month"
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

  [goalType.MONTHLY_SPEND]: (goal: TGoal, context: TContext): GoalProgress => {
    // "I need at least 1000$ for this month"
    // if no leftover behaves the same way as MONTHLY svings goal

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

  [goalType.INCOME_PERCENT]: (goal: TGoal, context: TContext): GoalProgress => {
    // "I want to save 30% of my income"

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

  [goalType.TARGET_BALANCE]: (goal: TGoal, context: TContext): GoalProgress => {
    const { amount, end } = goal

    if (!end) {
      // "I want to get 1000$ laying in this envelope"

      const { leftover, available } = context
      const needNow = Math.max(round(amount - available), 0)
      const needStart = Math.max(round(amount - leftover), 0)
      return {
        needStart,
        needNow,
        targetBudget: needStart,
        progress: getProgress(amount, needNow),
      }
    } else {
      // "I want to get 1000$ laying in this envelope by Dec 2022"

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
    }
  },
}

export function getProgress(needStart: number, needNow: number): number {
  /*
  needStart  needNow   progress
  0          100       0
  100        100       0
  20         100       0
  0          0         1
  100        0         1
  100        20        0.8
  */
  if (needStart < 0) needStart = 0
  if (needNow <= 0) return 1
  if (needNow >= needStart) return 0
  let progress = round(1 - needNow / needStart)
  // 0.9999 -> 0.99
  if (progress >= 1) return 0.99
  return progress
}

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max)
}
