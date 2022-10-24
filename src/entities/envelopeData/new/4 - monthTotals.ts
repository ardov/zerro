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
import { toISOMonth } from '@shared/helpers/date'
import {
  getCalculatedEnvelopes,
  IEnvelopeWithData,
} from '../calculateEnvelopes'
import { getUserCurrencyCode } from '@entities/instrument'
import {
  addFxAmount,
  convertFx,
  isEqualFxAmount,
  subFxAmount,
} from '@shared/helpers/money'
import { TSelector } from '@store'

import { fxRates, TFxRateData } from '@entities/fxRate'
import { TFxRates } from '@entities/fxRate/fxRateStore'
import { withPerf } from '@shared/helpers/performance'
import { getEnvMetrics, TEnvMetrics } from './3 - calcEnvMetrics'
import { getCurrentFunds } from './1 - currentFunds'
import { getMonthList } from './1 - monthList'
import { getActivity, TActivityNode } from './2 - activity'
import { shallowEqual } from 'react-redux'

export type TMonthTotals = {
  month: TISOMonth
  // currency: TFxCode // display currency
  // rates: TFxRates // Currency rates for this month
  // envelopes: Record<TEnvelopeId, IEnvelopeWithData> // Amounts for each envelope

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
  monthListReversed.forEach(month => {
    const isFuture = month > currentMonth
    const isCurrent = month === currentMonth

    // Funds part
    let fundsEnd =
      isFuture || isCurrent ? currentFunds : result[prev].fundsStart
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

    let budgetedInFuture = {}
    let freeFunds = {}
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
  })

  console.log(result)

  return result
}

function makeTotals(month: TISOMonth) {
  return {
    month,
    fundsStart: {},
    fundsChange: {},
    fundsEnd: {},
    transferFees: {},
    generalIncome: {},
    envActivity: {},
    budgeted: {},
    available: {},
    budgetedInFuture: {},
    freeFunds: {},
    toBeBudgetedFx: {},
    toBeBudgeted: 0,
    overspend: {},
  }
}
