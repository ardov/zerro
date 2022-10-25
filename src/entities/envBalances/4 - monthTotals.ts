import { createSelector } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'
import { ById, ByMonth, TFxAmount, TISOMonth } from '@shared/types'
import { toISOMonth } from '@shared/helpers/date'
import { addFxAmount, subFxAmount } from '@shared/helpers/money'
import { withPerf } from '@shared/helpers/performance'
import { TSelector } from '@store'

import { getCurrentFunds } from './1 - currentFunds'
import { getMonthList } from './1 - monthList'
import { getActivity, TActivityNode } from './2 - activity'
import { getEnvMetrics, TEnvMetrics } from './3 - envMetrics'

export type TMonthTotals = {
  month: TISOMonth
  // Money amounts for month
  fundsStart: TFxAmount
  fundsChange: TFxAmount
  fundsEnd: TFxAmount
  // Detailed money movements
  transferFees: TFxAmount // Transfer fees
  generalIncome: TFxAmount // Unsorted income
  envActivity: TFxAmount // Transactions associated with envelopes
  // Envelope totals
  budgeted: TFxAmount
  available: TFxAmount

  budgetedInFuture: TFxAmount // Total amount of money budgeted in future months
  freeFunds: TFxAmount
  toBeBudgeted: TFxAmount
  overspend: TFxAmount
}

export const getMonthTotals: TSelector<ByMonth<TMonthTotals>> = createSelector(
  [getMonthList, getCurrentFunds, getActivity, getEnvMetrics],
  withPerf('🖤 getMonthTotals', calcMonthTotals)
)

function calcMonthTotals(
  months: TISOMonth[],
  currentFunds: TFxAmount,
  activity: ByMonth<TActivityNode>,
  envMetrics: ByMonth<ById<TEnvMetrics>>
) {
  const result: ByMonth<TMonthTotals> = {}

  const currentMonth = toISOMonth(Date.now())
  const monthListReversed = [...months].reverse()

  let prev = monthListReversed[0]
  monthListReversed.forEach((month, idx) => {
    const isFuture = month > currentMonth
    const isCurrent = month === currentMonth
    const prevMonth = result[prev] || {}

    if (idx === 0) {
      console.assert(isFuture || isCurrent, 'Last month is in the past')
    }

    // Funds part
    let fundsEnd = isFuture || isCurrent ? currentFunds : prevMonth.fundsStart
    let fundsChange = activity[month]?.total || {}
    let fundsStart = subFxAmount(fundsEnd, fundsChange)

    let transferFees = activity[month]?.transferFees.total || {}
    let generalIncome = activity[month]?.generalIncome.total || {}
    let envActivity = activity[month]?.envActivity.total || {}
    console.assert(
      shallowEqual(
        fundsChange,
        addFxAmount(transferFees, generalIncome, envActivity)
      ),
      'Total change is not equal to sum of transfers + income + anv activity'
    )

    let budgeted = {}
    let available = {}
    Object.values(envMetrics[month]).forEach(metrics => {
      if (!metrics.parent) {
        budgeted = addFxAmount(budgeted, metrics.totalBudgeted)
        available = addFxAmount(available, metrics.totalAvailable)
      }
    })

    let budgetedInFuture = addFxAmount(
      prevMonth.budgeted || {},
      prevMonth.budgetedInFuture || {}
    )

    let freeFunds = subFxAmount(fundsEnd, available)
    let toBeBudgeted = {}
    let overspend = {}

    result[month] = {
      month,
      fundsStart,
      fundsChange,
      fundsEnd,
      transferFees,
      generalIncome,
      envActivity,
      budgeted,
      available,
      budgetedInFuture,
      freeFunds,
      toBeBudgeted,
      overspend,
    }
    prev = month
  })

  return result
}
