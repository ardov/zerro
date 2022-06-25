import { createSelector } from '@reduxjs/toolkit'
import { round } from 'shared/helpers/currencyHelpers'
import { getGoals } from 'store/data/hiddenData/goals'
import { getAmountsById } from './getAmountsByTag'
import { getMonthDates } from './getMonthDates'
import differenceInCalendarMonths from 'date-fns/differenceInCalendarMonths'
import { goalType } from 'store/data/hiddenData/constants'
import { TGoal, TSelector } from 'shared/types'
import { RootState } from 'store'
import { getTagMeta } from 'store/data/hiddenData/tagMeta'
import { convertCurrency } from 'store/data/instruments'

const { MONTHLY, MONTHLY_SPEND, TARGET_BALANCE } = goalType

/**
 * Goal progress per month
 * - `progress` — number from 0 to 1. It is goal completion progress for month or overall (for TARGET_BALANCE without end date)
 * - `need` — amount of money you should add to your budget to complete the goal
 * - `target` — budget needed to complete the goal in current
 */
export type GoalProgress = {
  progress: number
  need: number
  target: number
}

export const getGoalProgress = (state: RootState, month: number, id: string) =>
  getGoalsProgress(state)?.[month]?.[id]

export const getGoalsProgress: TSelector<{
  [month: number]: {
    [tagId: string]: GoalProgress | null
  }
}> = createSelector(
  [getGoals, getAmountsById, getMonthDates, getTagMeta, convertCurrency],

  (goals, amountsById, monthList, tagMeta, convert) => {
    const result: {
      [month: number]: {
        [tagId: string]: GoalProgress | null
      }
    } = {}

    monthList.forEach((month, i) => {
      result[month] = {}

      for (const id in goals) {
        if (!goals[id]) continue
        const { currency } = tagMeta[id] || {}
        const amount = currency
          ? round(convert(goals[id].amount, currency))
          : goals[id].amount
        const { type, end } = goals[id]
        if (end && end < month) continue
        if (!amount) continue
        const tag = amountsById?.[month]?.[id]
        if (!tag) continue

        const budgeted = tag.totalBudgeted
        const leftover = tag.totalLeftover
        const available = tag.totalAvailable

        switch (type) {
          case MONTHLY:
            result[month][id] = calcMonthlyProgress({ amount, budgeted })
            break

          case MONTHLY_SPEND:
            result[month][id] = calcMonthlySpendProgress({
              amount,
              budgeted,
              leftover,
            })
            break

          case TARGET_BALANCE:
            result[month][id] = calcTargetProgress({
              amount,
              budgeted,
              leftover,
              available,
              currentMonth: month,
              endMonth: end,
            })
            break

          default:
            throw Error(`Unknown goal type: ${type}`)
        }
      }
    })
    return result
  }
)

export const getTotalGoalsProgress: TSelector<{
  [month: number]: GoalProgress | null
}> = createSelector([getGoals, getGoalsProgress], (goals, goalsProgress) => {
  let result: { [month: number]: GoalProgress | null } = {}

  const isCounted = (goal: TGoal) => goal.type !== TARGET_BALANCE || goal.end
  let countedGoals: { [id: string]: TGoal } = {}
  let hasCountedGoals = false
  for (const id in goals) {
    if (isCounted(goals[id])) {
      countedGoals[id] = goals[id]
      hasCountedGoals = true
    }
  }

  for (const month in goalsProgress) {
    if (!hasCountedGoals) {
      result[month] = null
      continue
    }

    let needSum = 0
    let targetSum = 0
    let totalProgress = 0
    for (const tag in countedGoals) {
      const { target = 0, need = 0 } = goalsProgress[month][tag] || {}
      if (need > 0) needSum = round(needSum + need)
      if (target > 0) targetSum = round(targetSum + target)
    }

    if (targetSum > 0) totalProgress = (targetSum - needSum) / targetSum
    else if (targetSum === 0 && needSum > 0) totalProgress = 0
    else totalProgress = 1

    result[month] = {
      need: needSum,
      target: targetSum,
      progress: totalProgress,
    }
  }

  return result
})

function calcMonthlyProgress(data: {
  amount: number
  budgeted: number
}): GoalProgress {
  const { amount, budgeted } = data
  const target = amount
  const need = round(target - budgeted)

  if (budgeted <= 0) return { progress: 0, need, target }
  if (budgeted >= target) return { progress: 1, need: 0, target }
  return { progress: budgeted / target, need, target }
}

function calcMonthlySpendProgress(data: {
  amount: number
  budgeted: number
  leftover: number
}): GoalProgress {
  const { amount, budgeted, leftover } = data
  const target = round(amount - leftover)
  const need = round(target - budgeted)

  if (budgeted + leftover <= 0) return { progress: 0, need, target }
  if (budgeted + leftover >= amount) return { progress: 1, need: 0, target }
  return { progress: (budgeted + leftover) / amount, need, target }
}

function calcTargetProgress(data: {
  amount: number
  budgeted: number
  leftover: number
  available: number
  currentMonth: number
  endMonth?: number
}): GoalProgress | null {
  const { amount, budgeted, leftover, available, currentMonth, endMonth } = data
  if (!endMonth) {
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
    if (currentMonth > endMonth) return null

    const monthsLeft = differenceInCalendarMonths(endMonth, currentMonth) + 1
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
