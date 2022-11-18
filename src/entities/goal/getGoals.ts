import { createSelector } from '@reduxjs/toolkit'
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
import { withPerf } from '@shared/helpers/performance'
import { TSelector } from '@store/index'

import { TFxRateData } from '@entities/fxRate'
import { balances, TActivityNode, TEnvMetrics } from '@entities/envBalances'
import { TGoal } from './shared/types'
import { goalStore, TGoals } from './goalStore'
import { calcGoals } from './shared/calcGoals'

export type TGoalInfo = {
  id: TEnvelopeId
  goal: TGoal
  month: TISOMonth
  currency: TFxCode
  /** Goal completion progress [0 - 1] */
  progress: number
  /** Amount of money needed to complete the goal */
  needNow: number
  /** Amount of money needed to complete the goal before budget */
  needStart: number
  /** Target budget which will complete the goal */
  targetBudget: number
}

export const getGoals: TSelector<ByMonth<ById<TGoalInfo>>> = createSelector(
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
  const result: ByMonth<ById<TGoalInfo>> = {}

  let prev: TISOMonth | null = null
  months.forEach(month => {
    const goals = envGoals[month] || {}
    const metrics = envMetrics[month]
    const rates = ratesData[month].rates
    const activity = monthActivity[month]
    let node: ById<TGoalInfo> = {}

    keys(metrics).forEach(id => {
      const goal = getGoal(month, goals[id], prev && result[prev][id]?.goal)
      if (!goal) return
      const env = metrics[id]
      const toValue = (amount?: TFxAmount) =>
        amount ? convertFx(amount, env.currency, rates) : 0
      const goalProgress = calcGoals[goal.type](goal, {
        leftover: toValue(env.totalLeftover),
        budgeted: toValue(env.totalBudgeted),
        available: toValue(env.totalAvailable),
        generalIncome: toValue(activity?.generalIncome?.total),
        month,
      })

      node[id] = {
        id,
        goal,
        month,
        currency: env.currency,
        progress: goalProgress.progress,
        needNow: goalProgress.needNow,
        needStart: goalProgress.needStart,
        targetBudget: goalProgress.targetBudget,
      }
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
  if (currGoal === null) return null // deleted goal
  const goal = currGoal || prevGoal || null
  if (goal?.end && goal.end < currMonth) return null // expired goal
  return goal
}
