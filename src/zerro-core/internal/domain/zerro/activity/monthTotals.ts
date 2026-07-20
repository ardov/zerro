import { addFxAmount, subFxAmount } from '../../zenmoney/model/money'
import type { ById, ByMonth } from '../../foundation/types'
import type { TFxAmount } from '../../zenmoney/model/money'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TFxConverter } from '../fx-rates'
import type { TActivityNode } from './activity'
import type { TEnvMetrics } from './envMetrics'

export type TToBeBudgetedState = 'positive' | 'allocated' | 'negative'

export type TMonthTotals = {
  month: TISOMonth
  fundsStart: TFxAmount
  fundsChange: TFxAmount
  fundsEnd: TFxAmount
  transferFees: TFxAmount
  generalIncome: TFxAmount
  envActivity: TFxAmount
  budgeted: TFxAmount
  positiveBudgeted: TFxAmount
  available: TFxAmount
  budgetedInFuture: TFxAmount
  freeFunds: TFxAmount
  toBeBudgeted: TFxAmount
  toBeBudgetedState: TToBeBudgetedState
  overspend: TFxAmount
}

export type TBuildMonthTotalsInput = {
  monthList: TISOMonth[]
  currentFunds: TFxAmount
  activity: ByMonth<TActivityNode>
  envMetrics: ByMonth<ById<TEnvMetrics>>
  convertFx: TFxConverter
  currentMonth: TISOMonth
}

export function buildMonthTotals(
  input: TBuildMonthTotalsInput
): ByMonth<TMonthTotals> {
  const result: ByMonth<TMonthTotals> = {}
  const monthListReversed = [...input.monthList].reverse()

  let prev = monthListReversed[0]
  monthListReversed.forEach((month, index) => {
    const toValue = (amount: TFxAmount) => input.convertFx(amount, 'USD', month)
    const isFuture = month > input.currentMonth
    const isCurrent = month === input.currentMonth
    const prevMonth = result[prev] || ({} as Partial<TMonthTotals>)

    if (index === 0) {
      console.assert(isFuture || isCurrent, 'Last month is in the past')
    }

    const fundsEnd =
      isFuture || isCurrent ? input.currentFunds : prevMonth.fundsStart || {}
    const fundsChange = input.activity[month]?.total || {}
    const fundsStart = subFxAmount(fundsEnd, fundsChange)

    const transferFees = input.activity[month]?.transferFees.total || {}
    const generalIncome = input.activity[month]?.generalIncome.total || {}
    const envActivity = input.activity[month]?.envActivity.total || {}
    console.assert(
      isSameFxAmount(
        fundsChange,
        addFxAmount(transferFees, generalIncome, envActivity)
      ),
      'Total change is not equal to sum of transfers + income + env activity'
    )

    let positiveBudgeted = {} as TFxAmount
    let budgeted = {} as TFxAmount
    let available = {} as TFxAmount
    let overspend = {} as TFxAmount

    Object.values(input.envMetrics[month]).forEach(metrics => {
      if (metrics.parent) return

      const { totalBudgeted, totalAvailable, selfAvailable } = metrics
      budgeted = addFxAmount(budgeted, totalBudgeted)
      available = addFxAmount(available, totalAvailable)

      if (toValue(totalBudgeted) > 0) {
        positiveBudgeted = addFxAmount(positiveBudgeted, totalBudgeted)
      }

      if (toValue(selfAvailable) < 0) {
        overspend = addFxAmount(overspend, selfAvailable)
      }
    })

    const budgetedInFuture = addFxAmount(
      prevMonth.positiveBudgeted || {},
      prevMonth.budgetedInFuture || {}
    )
    const freeFunds = subFxAmount(fundsEnd, available)
    const toBeBudgetedInfo = calcToBeBudgeted(
      freeFunds,
      budgetedInFuture,
      toValue
    )

    result[month] = {
      month,
      fundsStart,
      fundsChange,
      fundsEnd,
      transferFees,
      generalIncome,
      envActivity,
      budgeted,
      positiveBudgeted,
      available,
      budgetedInFuture,
      freeFunds,
      toBeBudgeted: toBeBudgetedInfo.value,
      toBeBudgetedState: toBeBudgetedInfo.state,
      overspend,
    }
    prev = month
  })

  return result
}

function calcToBeBudgeted(
  freeNow: TFxAmount,
  needForFuture: TFxAmount,
  toValue: (amount: TFxAmount) => number
): { value: TFxAmount; state: TToBeBudgetedState } {
  if (toValue(freeNow) < 0) {
    return { value: freeNow, state: 'negative' }
  }
  const withFuture = subFxAmount(freeNow, needForFuture)
  if (toValue(withFuture) > 0) {
    return { value: withFuture, state: 'positive' }
  }
  return { value: {}, state: 'allocated' }
}

function isSameFxAmount(left: TFxAmount, right: TFxAmount): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const key of keys) {
    if (left[key] !== right[key]) return false
  }
  return true
}
