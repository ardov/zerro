import createSelector from 'selectorator'
import { round } from 'helpers/currencyHelpers'
import { getGoals } from 'store/localData/hiddenData/goals'
import { getAmountsForTag } from './getAmountsByTag'
import getMonthDates from './getMonthDates'
import differenceInCalendarMonths from 'date-fns/differenceInCalendarMonths'
import { GOAL_TYPES } from 'store/localData/hiddenData/constants'

const { MONTHLY, MONTHLY_SPEND, TARGET_BALANCE } = GOAL_TYPES
const startForOldGoals = +new Date(2019, 1, 1)

export const getGoalProgress = (state, month, id) =>
  getGoalsProgress(state)?.[month]?.[id]

export const getGoalsProgress = createSelector(
  [getGoals, getAmountsForTag, getMonthDates],
  (goals, getAmounts, monthList) => {
    const result = {}

    monthList.forEach((month, i) => {
      result[month] = {}

      for (const id in goals) {
        if (!goals[id]) continue
        const { type, amount, start = startForOldGoals, end } = goals[id]
        if (start && start > month) continue
        if (end && end < month) continue
        if (!amount) continue
        const tag = getAmounts(month, id) || {}

        const budgeted = tag.children
          ? tag.totalBudgeted || 0
          : tag.budgeted || 0
        const leftover = tag.children
          ? tag.totalLeftover || 0
          : tag.leftover || 0
        const available = tag.children
          ? tag.totalAvailable || 0
          : tag.available || 0

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

export const getTotalGoalsProgress = createSelector(
  [getGoals, getGoalsProgress],
  (goals, goalsProgress) => {
    let result = {}

    for (const month in goalsProgress) {
      let needSum = 0
      let targetSum = 0

      for (const tag in goalsProgress[month]) {
        if (goals[tag].type === TARGET_BALANCE && !goals[tag].end) continue
        const { target = 0, need = 0 } = goalsProgress[month][tag]
        if (need > 0) needSum = round(needSum + need)
        if (target > 0) targetSum = round(targetSum + target)
      }

      const progress = targetSum ? (targetSum - needSum) / targetSum : 0

      result[month] = {
        need: needSum,
        target: targetSum,
        progress,
      }
    }

    return result
  }
)

function calcMonthlyProgress({ amount, budgeted }) {
  const target = amount
  const need = round(target - budgeted)

  if (budgeted <= 0) return { progress: 0, need, target }
  if (budgeted >= target) return { progress: 1, need: 0, target }
  return { progress: budgeted / target, need, target }
}

function calcMonthlySpendProgress({ amount, budgeted, leftover }) {
  const target = round(amount - leftover)
  const need = round(target - budgeted)

  if (budgeted + leftover <= 0) return { progress: 0, need, target }
  if (budgeted + leftover >= amount) return { progress: 1, need: 0, target }
  return { progress: (budgeted + leftover) / amount, need, target }
}

function calcTargetProgress({
  amount,
  budgeted,
  available,
  currentMonth,
  endMonth,
}) {
  if (!endMonth) {
    // No end date
    const target = round(amount - available + budgeted)

    if (target <= 0) return { progress: 1, need: 0, target: 0 }
    if (available <= 0) return { progress: 0, need: target, target }
    return {
      progress: available / amount,
      need: round(target - available),
      target,
    }
  } else {
    // Goal has end date
    if (currentMonth > endMonth) return null

    const startMonthAvailable = available - budgeted
    const monthsLeft = differenceInCalendarMonths(endMonth, currentMonth) + 1
    const totalNeed = amount - startMonthAvailable
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
