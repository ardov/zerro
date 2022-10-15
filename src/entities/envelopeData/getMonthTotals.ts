import { createSelector } from '@reduxjs/toolkit'
import { ById, TEnvelopeId, TFxAmount, TFxCode, TISOMonth } from '@shared/types'
import { keys } from '@shared/helpers/keys'
import { getCurrentFunds } from './parts/currentFunds'
import { toISOMonth } from '@shared/helpers/date'
import { getActivity, TMonthActivity } from './parts/activity'
import { getCalculatedEnvelopes, IEnvelopeWithData } from './calculateEnvelopes'
import { getUserCurrencyCode } from '@entities/instrument'
import {
  addFxAmount,
  convertFx,
  isEqualFxAmount,
  subFxAmount,
} from '@shared/helpers/money'
import { TSelector } from '@store'
import { getMonthList } from './parts/monthList'
import { fxRates, TFxRateData } from '@entities/fxRate'
import { TFxRates } from '@entities/fxRate/fxRateStore'
import { withPerf } from '@shared/helpers/performance'

export type TMonthTotals = {
  month: TISOMonth
  currency: TFxCode // display currency
  rates: TFxRates // Currency rates for this month
  envelopes: Record<TEnvelopeId, IEnvelopeWithData> // Amounts for each envelope

  // Money amounts for month
  fundsStart: TFxAmount
  fundsChange: TFxAmount
  fundsEnd: TFxAmount

  // Detailed money movements
  transferFees: TFxAmount // Transfer fees
  generalIncome: TFxAmount // Unsorted income
  activity: TFxAmount // Transactions associated with envelopes

  // Envelope totals
  budgeted: TFxAmount
  available: TFxAmount

  budgetedInFuture: TFxAmount // Total amount of money budgeted in future months

  freeFunds: TFxAmount

  toBeBudgetedFx: TFxAmount
  toBeBudgeted: number

  overspend: TFxAmount
}

export const getMonthTotals: TSelector<Record<TISOMonth, TMonthTotals>> =
  createSelector(
    [
      getMonthList,
      getCalculatedEnvelopes,
      getActivity,
      getCurrentFunds,
      fxRates.getter,
      getUserCurrencyCode,
    ],
    withPerf('getMonthTotals', aggregateEnvelopeBudgets)
  )

function aggregateEnvelopeBudgets(
  monthList: TISOMonth[],
  envelopes: Record<TISOMonth, ById<IEnvelopeWithData>>,
  activity: Record<TISOMonth, TMonthActivity>,
  currentBalance: TFxAmount,
  getRates: (month: TISOMonth) => TFxRateData,
  mainCurrency: TFxCode
) {
  const result: Record<TISOMonth, TMonthTotals> = {}

  const monthListReversed = [...monthList].reverse()

  // Fill with empty nodes
  monthList.forEach(
    date =>
      (result[date] = createMonth(
        date,
        getRates(date),
        mainCurrency,
        envelopes[date],
        activity[date]
      ))
  )

  // Fill current month funds
  const currentMonth = toISOMonth(Date.now())
  result[currentMonth].fundsEnd = currentBalance

  // Fill future months funds
  monthList.forEach((date, idx, arr) => {
    if (date <= currentMonth) return
    let prevMonth = arr[idx - 1]
    let prevFunds = result[prevMonth].fundsEnd
    // Do not count changes in future months cause it can lead to unpredictable results. And there should be no balance changes in future months.
    result[date].fundsEnd = { ...prevFunds }
  })

  // Fill previous months funds
  keys(result)
    .sort()
    .reverse()
    .forEach((date, idx, arr) => {
      if (date >= currentMonth) return
      // Array is sorted in reverse order
      let nextMonth = arr[idx - 1]
      let nextFunds = result[nextMonth].fundsStart
      result[date].fundsEnd = { ...nextFunds }
    })

  // Fill with budgeted in future
  let budgetedInFuture: TFxAmount = {}
  monthListReversed.forEach(date => {
    result[date].budgetedInFuture = { ...budgetedInFuture }
    budgetedInFuture = addFxAmount(budgetedInFuture, result[date].budgeted)
  })

  return result
}

/**
 * Creates month node and fills
 * - rates
 * - calculated envelopes
 * - activity
 * - mainCurrency
 */
function createMonth(
  month: TISOMonth,
  rateData: TFxRateData,
  displayCurrency: TFxCode,
  envelopes: ById<IEnvelopeWithData>,
  activity: TMonthActivity
) {
  const convert = (fx: TFxAmount) =>
    convertFx(fx, displayCurrency, rateData.rates)
  const totals: TMonthTotals = {
    month,
    rates: rateData.rates,
    currency: displayCurrency,
    envelopes: envelopes || ({} as ById<IEnvelopeWithData>),
    budgetedInFuture: {}, // Fills later

    fundsEnd: {}, // Fills later
    fundsChange: activity?.totalActivity || {},

    get fundsStart(): TFxAmount {
      return subFxAmount(this.fundsEnd, this.fundsChange)
    },

    // Detailed activity
    transferFees: activity?.transferFees?.activity || {},
    generalIncome: activity?.generalIncome?.activity || {},
    get activity(): TFxAmount {
      return Object.values(this.envelopes)
        .filter(e => !e.env.parent)
        .reduce(
          (acc, envelope) => addFxAmount(acc, envelope.totalActivity),
          {} as TFxAmount
        )
    },

    // Envelope totals
    get budgeted(): TFxAmount {
      return Object.values(this.envelopes)
        .filter(e => !e.env.parent)
        .reduce(
          (acc, envelope) => addFxAmount(acc, envelope.totalBudgeted),
          {} as TFxAmount
        )
    },

    get available(): TFxAmount {
      return Object.values(this.envelopes)
        .filter(e => !e.env.parent)
        .reduce(
          (acc, envelope) => addFxAmount(acc, envelope.totalAvailable),
          {} as TFxAmount
        )
    },

    get freeFunds() {
      return subFxAmount(this.fundsEnd, this.available)
    },

    get toBeBudgetedFx() {
      const freeFundsAmount = convert(this.freeFunds)

      // If we don't have any free funds
      if (freeFundsAmount <= 0) return this.freeFunds

      const freeWithFutureBudgets = subFxAmount(
        this.freeFunds,
        this.budgetedInFuture
      )
      const freeWithFutureBudgetsAmount = convert(freeWithFutureBudgets)

      if (freeWithFutureBudgetsAmount <= 0) return {} as TFxAmount

      return freeWithFutureBudgets
    },

    get toBeBudgeted() {
      return convert(this.toBeBudgetedFx)
    },

    get overspend(): TFxAmount {
      const { envelopes } = this
      return Object.values(envelopes)
        .filter(
          envelope => !envelope.env.parent && envelope.selfAvailableValue < 0
        )
        .reduce(
          (acc, envelope) => addFxAmount(acc, envelope.selfAvailable),
          {} as TFxAmount
        )
    },
  }

  // Check calculations
  let totalChange = addFxAmount(
    totals.activity,
    totals.transferFees,
    totals.generalIncome
  )
  if (!isEqualFxAmount(totals.fundsChange, totalChange))
    console.log(
      `🛑 ${month} Error in calculations`,
      totals.fundsChange,
      totalChange,
      totals
    )

  return totals
}
