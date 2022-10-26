import {
  ById,
  ByMonth,
  TEnvelopeId,
  TFxAmount,
  TFxCode,
  TISOMonth,
} from '@shared/types'
import { keys } from '@shared/helpers/keys'
import { convertFx } from '@shared/helpers/money'

import { TFxRateData } from '@entities/fxRate'
import { balances, TActivityNode, TEnvMetrics } from '@entities/envBalances'
import { TGoal } from './types'
import { calculateGoalProgress, GoalProgress } from './goalProgress'
import { goalStore, TGoals } from './goalStore'
import { TSelector } from '@store/index'
import { createSelector } from '@reduxjs/toolkit'
import { withPerf } from '@shared/helpers/performance'

export type TGoalInfo = {
  id: TEnvelopeId
  currency: TFxCode
  goal: TGoal
  state: GoalProgress
}

export const getGoals: TSelector<
  ByMonth<Record<TEnvelopeId, TGoalInfo | undefined>>
> = createSelector(
  [
    goalStore.getData,
    balances.monthList,
    balances.envData,
    balances.activity,
    balances.rates,
  ],
  withPerf('🖤 getGoals', calcGoalData)
)

/** Adds monthly goals and calculates their progress */
function calcGoalData(
  envGoals: ByMonth<TGoals>,
  months: TISOMonth[],
  envMetrics: ByMonth<ById<TEnvMetrics>>,
  monthActivity: ByMonth<TActivityNode>,
  ratesData: ByMonth<TFxRateData>
) {
  const result: ByMonth<Record<TEnvelopeId, TGoalInfo | undefined>> = {}

  let prev: TISOMonth | null = null
  months.forEach(month => {
    const goals = envGoals[month] || {}
    const metrics = envMetrics[month]
    const rates = ratesData[month].rates
    const activity = monthActivity[month]
    let node: Record<TEnvelopeId, TGoalInfo | undefined> = {}

    keys(metrics).forEach(id => {
      const goal = getGoal(month, goals[id], prev && result[prev][id]?.goal)
      if (!goal) return
      const env = metrics[id]
      const toValue = (amount?: TFxAmount) =>
        amount ? convertFx(amount, env.currency, rates) : 0
      const state = calculateGoalProgress(goal, {
        leftover: toValue(env.totalLeftover),
        budgeted: toValue(env.totalBudgeted),
        available: toValue(env.totalAvailable),
        generalIncome: toValue(activity?.generalIncome?.total),
        month,
      })

      node[id] = { id, goal, state, currency: env.currency }
    })

    result[month] = node
    prev = month
  })

  return result
}

/** Returns valid current goal */
function getGoal(
  currMonth: TISOMonth,
  currGoal?: TGoal | null,
  prevGoal?: TGoal | null
) {
  const goal = currGoal || prevGoal || null
  if (goal?.end && goal.end < currMonth) return null // expired goal
  return goal
}
