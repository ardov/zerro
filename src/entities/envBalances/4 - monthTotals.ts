import { createSelector } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'
import { ById, ByMonth, TFxAmount, TISOMonth } from '@shared/types'
import { toISOMonth } from '@shared/helpers/date'
import { addFxAmount, convertFx, subFxAmount } from '@shared/helpers/money'
import { withPerf } from '@shared/helpers/performance'
import { TSelector } from '@store'

import { getCurrentFunds } from './1 - currentFunds'
import { getMonthList } from './1 - monthList'
import { getActivity, TActivityNode } from './2 - activity'
import { getEnvMetrics, TEnvMetrics } from './3 - envMetrics'
import { getRatesByMonth } from './2 - rates'
import { TFxRateData, TFxRates } from '@entities/currency/fxRate'

type TToBeBudgetedState = 'positive' | 'allocated' | 'negative'

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
  positiveBudgeted: TFxAmount // Used to calculate budgetedInFuture
  available: TFxAmount

  budgetedInFuture: TFxAmount // Total amount of money budgeted in future months
  freeFunds: TFxAmount
  toBeBudgeted: TFxAmount
  toBeBudgetedState: TToBeBudgetedState
  overspend: TFxAmount
}

export const getMonthTotals: TSelector<ByMonth<TMonthTotals>> = createSelector(
  [getMonthList, getCurrentFunds, getActivity, getEnvMetrics, getRatesByMonth],
  withPerf('🖤 getMonthTotals', calcMonthTotals)
)

function calcMonthTotals(
  months: TISOMonth[],
  currentFunds: TFxAmount,
  activity: ByMonth<TActivityNode>,
  envMetrics: ByMonth<ById<TEnvMetrics>>,
  rates: ByMonth<TFxRateData>
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

    let positiveBudgeted = {} // Used for budgetedInFuture
    let budgeted = {}
    let available = {}
    let overspend = {}
    Object.values(envMetrics[month]).forEach(metrics => {
      if (!metrics.parent) {
        budgeted = addFxAmount(budgeted, metrics.totalBudgeted)
        available = addFxAmount(available, metrics.totalAvailable)

        let budgetedValue = metrics.totalBudgeted[metrics.currency] || 0
        if (budgetedValue > 0) {
          positiveBudgeted = addFxAmount(
            positiveBudgeted,
            metrics.totalBudgeted
          )
        }

        let selfAvailableValue = metrics.selfAvailable[metrics.currency] || 0
        if (selfAvailableValue < 0) {
          overspend = addFxAmount(overspend, metrics.selfAvailable)
        }
      }
    })

    let budgetedInFuture = addFxAmount(
      prevMonth.positiveBudgeted || {},
      prevMonth.budgetedInFuture || {}
    )

    let freeFunds = subFxAmount(fundsEnd, available)
    let toBeBudgetedInfo = calcToBeBudgeted(
      freeFunds,
      budgetedInFuture,
      rates[month].rates
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
  rates: TFxRates
): { value: TFxAmount; state: TToBeBudgetedState } {
  const withFuture = subFxAmount(freeNow, needForFuture)
  const withFutureValue = convertFx(withFuture, 'USD', rates)
  const freeNowValue = convertFx(freeNow, 'USD', rates)
  if (freeNowValue < 0) return { value: freeNow, state: 'negative' }
  if (withFutureValue > 0) return { value: withFuture, state: 'positive' }
  return { value: {}, state: 'allocated' }
}
