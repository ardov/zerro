import { createSelector } from '@reduxjs/toolkit'
import { TEnvelopeId } from 'models/shared/envelopeHelpers'
import { TFxAmount, TFxCode, TISOMonth } from 'shared/types'
import { keys } from 'shared/helpers/keys'
import { getCurrentFunds } from './parts/currentFunds'
import { toISOMonth } from 'shared/helpers/date'
import { getActivity, TMonthActivity } from './parts/activity'
import { getMonthlyRates } from './parts/rates'
import { getCalculatedEnvelopes, IEnvelopeWithData } from './calculateEnvelopes'
import { getUserCurrencyCode } from 'models/instrument'
import {
  addFxAmount,
  convertFx,
  isEqualFxAmount,
  subFxAmount,
} from 'shared/helpers/currencyHelpers'
import { TSelector } from 'store'
import { getMonthList } from './parts/monthList'

export interface TEnvelopeBudgets {
  date: TISOMonth
  currency: TFxCode

  /** Currency rates for this month */
  rates: { [currency: TFxCode]: number }

  // Money amounts for month
  fundsStart: TFxAmount
  fundsChange: TFxAmount
  fundsEnd: TFxAmount

  /** Transfer fees */
  transferFees: TFxAmount
  /** Unsorted income */
  generalIncome: TFxAmount
  /** Transactions associated with envelopes */
  activity: TFxAmount

  /** Envelope totals */
  budgeted: TFxAmount

  /** Envelope totals */
  available: TFxAmount

  /** Total amount of money budgeted in future months */
  budgetedInFuture: TFxAmount
  displayBudgetedInFuture: number

  freeFunds: TFxAmount
  displayFreeFunds: number

  toBeBudgeted: TFxAmount
  displayToBeBudgeted: number

  /** Amounts for each envelope */
  envelopes: Record<TEnvelopeId, IEnvelopeWithData>
}

export const getComputedTotals: TSelector<Record<TISOMonth, TEnvelopeBudgets>> =
  createSelector(
    [
      getMonthList,
      getCalculatedEnvelopes,
      getActivity,
      getCurrentFunds,
      getMonthlyRates,
      getUserCurrencyCode,
    ],
    aggregateEnvelopeBudgets
  )

function aggregateEnvelopeBudgets(
  monthList: TISOMonth[],
  envelopes: Record<TISOMonth, { [id: TEnvelopeId]: IEnvelopeWithData }>,
  activity: Record<TISOMonth, TMonthActivity>,
  currentBalance: TFxAmount,
  rates: Record<TISOMonth, { [fx: TFxCode]: number }>,
  mainCurrency: TFxCode
) {
  const result: Record<TISOMonth, TEnvelopeBudgets> = {}

  const monthListReversed = [...monthList].reverse()

  // Fill with empty nodes
  monthList.forEach(date => (result[date] = createMonth(date)))

  // Fill current month funds
  const currentMonth = toISOMonth(Date.now())
  result[currentMonth].fundsEnd = currentBalance
  result[currentMonth].fundsStart = subFxAmount(
    result[currentMonth].fundsEnd,
    result[currentMonth].fundsChange
  )

  // Fill future months funds
  monthList.forEach((date, idx, arr) => {
    if (date <= currentMonth) return
    let prevMonth = arr[idx - 1]
    let prevFunds = result[prevMonth].fundsEnd
    result[date].fundsStart = { ...prevFunds }
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
      result[date].fundsStart = subFxAmount(
        result[date].fundsEnd,
        result[date].fundsChange
      )
    })

  // Fill rest metrics
  let budgetedInFuture: TFxAmount = {}
  monthListReversed.forEach(date => {
    let m = result[date]
    const convert = (fx: TFxAmount) => convertFx(fx, m.currency, m.rates)

    // freeFunds: TFxAmount
    // displayFreeFunds: number
    m.freeFunds = subFxAmount(m.fundsEnd, m.available)
    m.budgetedInFuture = { ...budgetedInFuture }
    m.toBeBudgeted = subFxAmount(m.freeFunds, m.budgetedInFuture)

    m.displayFreeFunds = convert(m.freeFunds)

    if (m.displayFreeFunds <= 0) {
      // If no free funds
      m.displayBudgetedInFuture = 0
      m.displayToBeBudgeted = m.displayFreeFunds
    } else {
      const realBudgetedInFuture = convert(m.budgetedInFuture)
      if (m.displayFreeFunds <= realBudgetedInFuture) {
        // Has free money but it all allocated in future
        m.displayBudgetedInFuture = m.displayFreeFunds
        m.displayToBeBudgeted = 0
      } else {
        // There are some free money
        m.displayBudgetedInFuture = realBudgetedInFuture
        m.displayToBeBudgeted = convert(m.toBeBudgeted)
      }
    }

    budgetedInFuture = addFxAmount(budgetedInFuture, m.budgeted)
  })

  return result

  /**
   * Creates month node and fills
   * - rates
   * - calculated envelopes
   * - activity
   * - mainCurrency
   */
  function createMonth(date: TISOMonth) {
    const month: TEnvelopeBudgets = {
      date,
      rates: rates[date],
      currency: mainCurrency,
      fundsStart: {}, // Fills later
      fundsEnd: {}, // Fills later
      fundsChange: activity[date]?.totalActivity || {},
      transferFees: activity[date]?.transferFees?.activity || {},
      generalIncome: activity[date]?.generalIncome?.activity || {},

      activity: {}, // to be calculated from envelopes
      budgeted: {}, // to be calculated from envelopes
      available: {}, // to be calculated from envelopes

      budgetedInFuture: {}, // Fills later
      displayBudgetedInFuture: 0, // Fills later

      toBeBudgeted: {}, // Fills later
      displayToBeBudgeted: 0, // Fills later

      freeFunds: {}, // Fills later
      displayFreeFunds: 0, // Fills later

      envelopes: envelopes[date] || {},
    }

    Object.values(month.envelopes).forEach(e => {
      if (e.parent) return
      month.activity = addFxAmount(month.activity, e.activity)
      month.budgeted = addFxAmount(month.budgeted, e.budgeted)
      month.available = addFxAmount(month.available, e.available)
    })

    // Check calculations
    let totalChange = addFxAmount(
      month.activity,
      month.transferFees,
      month.generalIncome
    )
    if (!isEqualFxAmount(month.fundsChange, totalChange))
      console.log(
        `🛑 ${date} Error in calculations`,
        month.fundsChange,
        totalChange,
        month
      )

    return month
  }
}
