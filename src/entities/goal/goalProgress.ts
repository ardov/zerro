import { round } from '@shared/helpers/money'
import { TISOMonth } from '@shared/types'
import { differenceInCalendarMonths, toISOMonth } from '@shared/helpers/date'
import { goalType, TGoal } from './types'

export type GoalProgress = {
  progress: number
  need: number
  target: number
}

type TContext = {
  month: TISOMonth
  leftover: number
  budgeted: number
  available: number
  generalIncome: number
}

export function calculateGoalProgress(
  goal: TGoal,
  data: TContext
): GoalProgress {
  switch (goal.type) {
    case goalType.MONTHLY:
      return calcMonthlyProgress(goal, data)
    case goalType.MONTHLY_SPEND:
      return calcMonthlySpendProgress(goal, data)
    case goalType.TARGET_BALANCE:
      return calcTargetProgress(goal, data)
    case goalType.INCOME_PERCENT:
      return calcIncomePercent(goal, data)
    default:
      return { progress: 0, need: 0, target: 0 }
  }
}

function calcMonthlyProgress(goal: TGoal, data: TContext): GoalProgress {
  const { amount } = goal
  const { budgeted } = data
  const target = amount
  const need = round(target - budgeted)

  if (budgeted <= 0) return { progress: 0, need, target }
  if (budgeted >= target) return { progress: 1, need: 0, target }
  return { progress: budgeted / target, need, target }
}

function calcIncomePercent(goal: TGoal, data: TContext): GoalProgress {
  const { amount } = goal
  let percent = amount <= 0 ? 0 : amount >= 1 ? 1 : amount
  const { generalIncome, budgeted } = data
  const target = round(percent * generalIncome)
  const need = round(target - budgeted)

  if (budgeted < 0) return { progress: 0, need, target }
  if (budgeted >= target) return { progress: 1, need: 0, target }
  return { progress: budgeted / target, need, target }
}

function calcMonthlySpendProgress(goal: TGoal, data: TContext): GoalProgress {
  const { amount } = goal
  const { budgeted, leftover } = data
  const target = round(amount - leftover)
  const need = round(target - budgeted)

  if (budgeted + leftover <= 0) return { progress: 0, need, target }
  if (budgeted + leftover >= amount) return { progress: 1, need: 0, target }
  return { progress: (budgeted + leftover) / amount, need, target }
}

function calcTargetProgress(goal: TGoal, data: TContext): GoalProgress {
  const { amount, end } = goal
  const { budgeted, leftover, available, month } = data
  if (!end) {
    // No end date
    const target = round(amount - available + budgeted)
    if (available >= amount) return { progress: 1, need: 0, target }
    return {
      progress: available < 0 ? 0 : available / amount,
      need: round(target - budgeted),
      target: target < 0 ? 0 : target,
    }
  } else {
    // Goal has end date
    const endMonth = toISOMonth(end)
    if (month > endMonth) {
      throw new Error('currentMonth > endMonth')
    }
    const monthsLeft = differenceInCalendarMonths(endMonth, month) + 1
    const totalNeed = amount - leftover
    if (totalNeed <= 0) return { progress: 1, need: 0, target: 0 }
    const target = Math.round(totalNeed / monthsLeft)
    if (budgeted <= 0)
      return {
        progress: 0,
        need: round(target - budgeted),
        target,
      }
    if (budgeted >= target) return { progress: 1, need: 0, target }

    return {
      progress: budgeted / target,
      need: round(target - budgeted),
      target,
    }
  }
}
