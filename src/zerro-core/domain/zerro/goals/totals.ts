import { keys } from '../../shared/keys'
import { addFxAmount } from '../../shared/money'
import type { ById, ByMonth } from '../../shared/types'
import type { TFxAmount } from '../../shared/money'
import type { TEnvelopeId } from '../envelope-id'
import type { TFxConverter } from '../fx-rates'
import { getProgress } from './progress'
import { goalType, TGoal } from './types'
import type { TGoalInfo } from './build'

export type TGoalTotals = {
  need: TFxAmount
  target: TFxAmount
  progress: number
  goalsCount: number
}

export function buildGoalTotals(
  goals: ByMonth<ById<TGoalInfo>>,
  convertFx: TFxConverter
): ByMonth<TGoalTotals> {
  const result: ByMonth<TGoalTotals> = {}

  keys(goals).forEach(month => {
    const toValue = (amount: TFxAmount) => convertFx(amount, 'USD', month)
    result[month] = calcGoalTotals(goals[month], toValue)
  })

  return result
}

function calcGoalTotals(
  goals: Record<TEnvelopeId, TGoalInfo | undefined>,
  toValue: (amount: TFxAmount) => number
): TGoalTotals {
  let totalTarget: TFxAmount = {}
  let totalNeedNow: TFxAmount = {}
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

  const progress = getProgress(toValue(totalNeedStart), toValue(totalNeedNow))
  console.assert(progress >= 0, 'Negative goal progress', goals)

  return {
    need: totalNeedNow,
    target: totalTarget,
    progress,
    goalsCount,
  }
}

function isCountedGoal(goal: TGoal) {
  if (goal.type === goalType.TARGET_BALANCE && !goal.end) return false
  return true
}
