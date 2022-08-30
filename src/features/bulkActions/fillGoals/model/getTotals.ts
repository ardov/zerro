import { createSelector } from '@reduxjs/toolkit'
import { addFxAmount, convertFx } from '@shared/helpers/money'
import { keys } from '@shared/helpers/keys'
import { TFxAmount, TISOMonth } from '@shared/types'
import { TSelector } from '@store'
import { goalType } from '@entities/goal'
import { getMonthTotals, TMonthTotals } from '@entities/envelopeData'

type TGoalTotals = ReturnType<typeof calcGoalTotals>

export const getTotals: TSelector<Record<TISOMonth, TGoalTotals>> =
  createSelector([getMonthTotals], totals => {
    let result: Record<TISOMonth, TGoalTotals> = {}
    keys(totals).forEach(month => {
      result[month] = calcGoalTotals(totals[month])
    })
    return result
  })
function calcGoalTotals(month: TMonthTotals) {
  let target: TFxAmount = {} // How much money should be budgeted
  let need: TFxAmount = {} // How much money still needed to fill goals
  let goalsCount = 0

  Object.values(month.envelopes).forEach(e => {
    // Skip envelopes without goals
    if (!e.goal) return

    // Skip envelopes with target balance goal and without end date
    if (e.goal.type === goalType.TARGET_BALANCE && !e.goal.end) return

    goalsCount++
    if (e.goalNeed && e.goalNeed > 0) {
      need = addFxAmount(need, { [e.currency]: e.goalNeed })
    }
    if (e.goalTarget && e.goalTarget > 0) {
      target = addFxAmount(target, { [e.currency]: e.goalTarget })
    }
  })

  let needValue = convertFx(need, month.currency, month.rates)
  let targetValue = convertFx(target, month.currency, month.rates)
  let progress = getProgress(targetValue, needValue)

  return {
    need,
    needValue,
    target,
    targetValue,
    progress,
    goalsCount,
  }
}
function getProgress(target: number, need: number): number {
  if (target > 0) return (target - need) / target
  if (target === 0 && need < 0) return 0
  return 1
}
