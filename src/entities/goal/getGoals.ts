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
import { add, convertFx, round } from '@shared/helpers/money'
import { withPerf } from '@shared/helpers/performance'
import { TSelector } from '@store/index'

import { TFxRateData } from '@entities/fxRate'
import { balances, TActivityNode, TEnvMetrics } from '@entities/envBalances'
import { goalType, TGoal } from './types'
import { goalStore, TGoals } from './goalStore'
import { differenceInCalendarMonths, toISOMonth } from '@shared/helpers/date'

export type TGoalInfo = {
  id: TEnvelopeId
  goal: TGoal
  month: TISOMonth
  currency: TFxCode
  progress: number
  need: number
  target: number
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
      const { progress, need, target } = calculateGoalProgress(goal, {
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
        progress,
        need,
        target,
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

type GoalProgress = {
  progress: number
  need: number
  target: number
}

type TContext = {
  month: TISOMonth
  leftover: number
  budgeted: number
  available: number
  generalIncome: number
}

function calculateGoalProgress(goal: TGoal, data: TContext): GoalProgress {
  switch (goal.type) {
    case goalType.MONTHLY:
      return calcMonthlyProgress(goal, data)
    case goalType.MONTHLY_SPEND:
      return calcMonthlySpendProgress(goal, data)
    case goalType.TARGET_BALANCE:
      return calcTargetProgress(goal, data)
    case goalType.INCOME_PERCENT:
      return calcIncomePercent(goal, data)
    default:
      return { progress: 0, need: 0, target: 0 }
  }
}

function calcMonthlyProgress(goal: TGoal, data: TContext): GoalProgress {
  const { amount } = goal
  const { budgeted } = data
  const target = amount
  const need = add(target, -budgeted)

  if (budgeted <= 0) return { progress: 0, need, target }
  if (budgeted >= target) return { progress: 1, need: 0, target }
  return { progress: budgeted / target, need, target }
}

function calcIncomePercent(goal: TGoal, data: TContext): GoalProgress {
  const { amount } = goal
  let percent = amount <= 0 ? 0 : amount >= 1 ? 1 : amount
  const { generalIncome, budgeted } = data
  const target = round(percent * generalIncome)
  const need = add(target, -budgeted)

  if (budgeted < 0) return { progress: 0, need, target }
  if (budgeted >= target) return { progress: 1, need: 0, target }
  return { progress: budgeted / target, need, target }
}

function calcMonthlySpendProgress(goal: TGoal, data: TContext): GoalProgress {
  const { amount } = goal
  const { budgeted, leftover } = data
  const target = add(amount, -leftover)
  const need = add(target, -budgeted)

  if (budgeted + leftover <= 0) return { progress: 0, need, target }
  if (budgeted + leftover >= amount) return { progress: 1, need: 0, target }
  return { progress: (budgeted + leftover) / amount, need, target }
}

function calcTargetProgress(goal: TGoal, data: TContext): GoalProgress {
  const { amount, end } = goal
  const { budgeted, leftover, available, month } = data
  if (!end) {
    // No end date
    const target = add(amount, -available, budgeted)
    if (available >= amount) return { progress: 1, need: 0, target }
    return {
      progress: available < 0 ? 0 : available / amount,
      need: add(target, -budgeted),
      target: target < 0 ? 0 : target,
    }
  } else {
    // Goal has end date
    const endMonth = toISOMonth(end)
    if (month > endMonth) {
      throw new Error('currentMonth > endMonth')
    }
    const monthsLeft = differenceInCalendarMonths(endMonth, month) + 1
    const totalNeed = amount - leftover
    if (totalNeed <= 0) return { progress: 1, need: 0, target: 0 }
    const target = Math.round(totalNeed / monthsLeft)
    if (budgeted <= 0)
      return {
        progress: 0,
        need: add(target, -budgeted),
        target,
      }
    if (budgeted >= target) return { progress: 1, need: 0, target }

    return {
      progress: budgeted / target,
      need: add(target, -budgeted),
      target,
    }
  }
}
