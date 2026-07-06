import { keys } from '6-shared/helpers/keys'
import type { ById, ByMonth, TFxAmount, TFxCode, TISOMonth } from '6-shared/types'
import type { TEnvelopeId } from '../envelope-id'
import type { TEnvMetrics } from '../activity/envMetrics'
import type { TSortedActivity } from '../activity/sortedActivity'
import type { TFxConverter } from '../fx-rates'
import { calcGoals } from './progress'
import type { TGoal } from './types'
import type { TGoals } from './read'

export type TGoalInfo = {
  id: TEnvelopeId
  goal: TGoal
  month: TISOMonth
  currency: TFxCode
  progress: number
  needNow: number
  needStart: number
  targetBudget: number
}

export type TBuildGoalsInput = {
  rawGoals: ByMonth<TGoals>
  monthList: TISOMonth[]
  envMetrics: ByMonth<ById<TEnvMetrics>>
  sortedActivity: ByMonth<TSortedActivity>
  convertFx: TFxConverter
}

export function buildGoals(input: TBuildGoalsInput): ByMonth<ById<TGoalInfo>> {
  const result: ByMonth<ById<TGoalInfo>> = {}
  let prev: TISOMonth | null = null

  input.monthList.forEach(month => {
    const goals = input.rawGoals[month] || {}
    const metrics = input.envMetrics[month]
    const totalIncome = input.sortedActivity[month]?.incomesTotal?.total || {}
    const node: ById<TGoalInfo> = {}

    keys(metrics).forEach(id => {
      const goal = getGoal(month, goals[id], prev && result[prev][id]?.goal)
      if (!goal) return

      const env = metrics[id]
      const toValue = (amount?: TFxAmount) =>
        amount ? input.convertFx(amount, env.currency, month) : 0
      const goalProgress = calcGoals[goal.type](goal, {
        leftover: toValue(env.totalLeftover),
        budgeted: toValue(env.totalBudgeted),
        available: toValue(env.totalAvailable),
        generalIncome: toValue(totalIncome),
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

function getGoal(
  currentMonth: TISOMonth,
  currentGoal?: TGoal | null,
  previousGoal?: TGoal | null
) {
  if (currentGoal === null) return null
  const goal = currentGoal || previousGoal || null
  if (goal?.end && goal.end < currentMonth) return null
  return goal
}
