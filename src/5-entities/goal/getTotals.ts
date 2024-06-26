import type { ByMonth, TFxAmount } from '6-shared/types'
import type { TEnvelopeId } from '5-entities/envelope'
import type { TSelector } from 'store'

import { createSelector } from '@reduxjs/toolkit'
import { addFxAmount } from '6-shared/helpers/money'
import { keys } from '6-shared/helpers/keys'

import { fxRateModel } from '5-entities/currency/fxRate'
import { getGoals, TGoalInfo } from './getGoals'
import { getProgress } from './shared/calcGoals'
import { goalType, TGoal } from './shared/types'

type TGoalTotals = ReturnType<typeof calcGoalTotals>

export const getTotals: TSelector<ByMonth<TGoalTotals>> = createSelector(
  [getGoals, fxRateModel.converter],
  (goals, convertFx) => {
    let result: ByMonth<TGoalTotals> = {}
    keys(goals).forEach(month => {
      const toValue = (amount: TFxAmount) => convertFx(amount, 'USD', month)
      result[month] = calcGoalTotals(goals[month], toValue)
    })
    return result
  }
)

function calcGoalTotals(
  goals: Record<TEnvelopeId, TGoalInfo | undefined>,
  toValue: (amount: TFxAmount) => number
) {
  let totalTarget: TFxAmount = {} // How much money should be budgeted
  let totalNeedNow: TFxAmount = {} // How much money still needed to fill goals
  let totalNeedStart: TFxAmount = {}
  let goalsCount = 0

  Object.values(goals).forEach(goalInfo => {
    if (!goalInfo) return
    const { goal, needNow, needStart, currency, targetBudget } = goalInfo
    if (!isCountedGoal(goal)) return

    goalsCount++

    totalNeedNow = addFxAmount(totalNeedNow, { [currency]: needNow })
    totalNeedStart = addFxAmount(totalNeedStart, { [currency]: needStart })

    if (targetBudget > 0) {
      totalTarget = addFxAmount(totalTarget, { [currency]: targetBudget })
    }
  })

  let progress = getProgress(toValue(totalNeedStart), toValue(totalNeedNow))

  console.assert(progress >= 0, 'Negative goal progress', goals)

  return {
    need: totalNeedNow,
    target: totalTarget,
    progress,
    goalsCount,
  }
}

/**
 * Decides should we skip these type of goals or not.
 * Saving goals without end date not counted towards monthly progress.
 */
function isCountedGoal(goal: TGoal) {
  if (goal.type === goalType.TARGET_BALANCE && !goal.end) return false
  return true
}
