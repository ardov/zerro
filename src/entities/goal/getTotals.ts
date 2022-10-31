import { createSelector } from '@reduxjs/toolkit'
import { addFxAmount, convertFx } from '@shared/helpers/money'
import { keys } from '@shared/helpers/keys'
import { ByMonth, TEnvelopeId, TFxAmount, TRates } from '@shared/types'
import { TSelector } from '@store'
import { getGoals, TGoalInfo } from './getGoals'
import { goalType } from './types'
import { balances } from '@entities/envBalances'

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
  let totalNeed: TFxAmount = {} // How much money still needed to fill goals
  let goalsCount = 0

  Object.values(goals).forEach(goalInfo => {
    if (!goalInfo) return

    const { goal, need, currency, target } = goalInfo
    // Skip envelopes with target balance goal and without end date
    if (goal.type === goalType.TARGET_BALANCE && !goal.end) return

    goalsCount++
    if (need > 0) {
      totalNeed = addFxAmount(totalNeed, { [currency]: need })
    }
    if (target > 0) {
      totalTarget = addFxAmount(totalTarget, { [currency]: target })
    }
  })

  let needValue = convertFx(totalNeed, 'USD', rates)
  let targetValue = convertFx(totalTarget, 'USD', rates)
  let progress = getProgress(targetValue, needValue)

  return {
    need: totalNeed,
    target: totalTarget,
    progress,
    goalsCount,
  }
}

function getProgress(target: number, need: number): number {
  if (target > 0) return (target - need) / target
  if (target === 0 && need < 0) return 0
  return 1
}
