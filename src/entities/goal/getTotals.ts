import { createSelector } from '@reduxjs/toolkit'
import { addFxAmount, convertFx } from '@shared/helpers/money'
import { keys } from '@shared/helpers/keys'
import { ByMonth, TFxAmount, TRates } from '@shared/types'
import { TSelector } from '@store'
import { getGoals, TGoalInfo } from './getGoals'
import { getProgress } from './shared/calcGoals'
import { goalType, TGoal } from './shared/types'
import { balances } from '@entities/envBalances'
import { TEnvelopeId } from '@entities/envelope'

type TGoalTotals = ReturnType<typeof calcGoalTotals>

export const getTotals: TSelector<ByMonth<TGoalTotals>> = createSelector(
  [getGoals, balances.rates],
  (goals, rates) => {
    let result: ByMonth<TGoalTotals> = {}
    keys(goals).forEach(month => {
      result[month] = calcGoalTotals(goals[month], rates[month].rates)
    })
    return result
  }
)

function calcGoalTotals(
  goals: Record<TEnvelopeId, TGoalInfo | undefined>,
  rates: TRates
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

  let progress = getProgress(
    convertFx(totalNeedStart, 'USD', rates),
    convertFx(totalNeedNow, 'USD', rates)
  )

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
