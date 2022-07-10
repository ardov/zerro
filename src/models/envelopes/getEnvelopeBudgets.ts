import { createSelector } from '@reduxjs/toolkit'
import { TEnvelopeId } from 'models/shared/envelopeHelpers'
import { getMonthDates } from 'pages/Budgets/selectors'
import { TISOMonth } from 'shared/types'
import { getEnvelopes, IEnvelope } from './parts/envelopes'
import { TInstAmount, subFxAmount } from './helpers/fxAmount'
import { keys } from 'shared/helpers/keys'
import { getCurrentFunds } from './parts/currentFunds'
import { toISOMonth } from 'shared/helpers/date'
import { getActivity } from './parts/activity'
import { makeFxRatesGetter } from 'models/fxRate'

interface IEnvelopeWithData extends IEnvelope {
  /** Activity calculated from income and outcome but depends on envelope settings. `keepIncome` affects this calculation */
  activityByFx: TInstAmount

  /** Activity converted to a currency of envelope */
  activity: number
  activitySelf: number
  activityChildren: number

  /** Leftover in a currency of envelope */
  leftover: number
  leftoverSelf: number
  leftoverChildren: number

  /** Budget in a currency of envelope */
  budgeted: number
  budgetedSelf: number
  budgetedChildren: number

  /** Available = `leftover` + `budgeted` + `activity` */
  available: number
  availableSelf: number
  availableChildren: number

  /** If there is negative amount in `available` */
  overspend: number
  overspendSelf: number
  overspendChildren: number
}

interface TEnvelopeBudgets {
  date: TISOMonth

  /** Currency rates for this month */
  rates: { [currency: string]: number }

  // Money amounts for month
  fundsStart: TInstAmount
  fundsChange: TInstAmount
  fundsEnd: TInstAmount

  // Transfer fees
  transferFees: TInstAmount

  /** Unsorted income */
  generalIncome: TInstAmount

  // Envelope totals
  budgeted: TInstAmount
  activity: TInstAmount
  overspend: TInstAmount
  available: TInstAmount

  /** Amounts for each envelope */
  envelopes: Record<TEnvelopeId, IEnvelopeWithData>
}

const getEnvelopeBudgets = createSelector([], () => {
  return {} as Record<TISOMonth, { [id: TEnvelopeId]: number }>
})

export const getComputedTotals = createSelector(
  [
    getMonthDates,
    getEnvelopes,
    getActivity,
    getCurrentFunds,
    makeFxRatesGetter,
    getEnvelopeBudgets,
  ],
  (monthList, envelopes, activity, currentBalance, getRates, budgets) => {
    const result: Record<TISOMonth, TEnvelopeBudgets> = {}

    // Fill with empty nodes
    monthList.forEach(date => (result[date] = createMonth(date)))

    // Fill current month funds
    const currentMonth = toISOMonth(Date.now())
    result[currentMonth].fundsEnd = { ...currentBalance }
    result[currentMonth].fundsStart = subFxAmount(
      result[currentMonth].fundsEnd,
      result[currentMonth].fundsChange
    )

    // Fill future months funds
    keys(result)
      .sort()
      .forEach((date, idx, arr) => {
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

    // Use first budgeting month here

    // Calculate envelope balances

    return result

    /**
     * Creates month node and fills
     * - rates
     * - budgets
     * - activity
     */
    function createMonth(date: TISOMonth) {
      const mActivity = activity[date] || {}
      const mBudgets = budgets[date] || {}

      // Create empty node
      const month: TEnvelopeBudgets = {
        date,
        rates: getRates(date),
        fundsStart: {},
        fundsEnd: {},
        fundsChange: mActivity?.totalActivity || {},
        transferFees: mActivity?.transferFees?.activity || {},
        generalIncome: mActivity?.generalIncome?.activity || {},
        budgeted: {},
        activity: {},
        overspend: {},
        available: {},
        envelopes: {},
      }

      // Fill envelopes with activity and budgets
      keys(envelopes).forEach(id => {
        month.envelopes[id] = makeEnvelopeWithData(envelopes[id])
        month.envelopes[id].activityByFx =
          mActivity?.envelopes?.[id]?.activity || {}
        month.envelopes[id].budgeted = mBudgets[id] || 0
      })

      return month
    }
  }
)

function makeEnvelopeWithData(e: IEnvelope): IEnvelopeWithData {
  return {
    ...e,
    activityByFx: {},
    activity: 0,
    activitySelf: 0,
    activityChildren: 0,
    leftover: 0,
    leftoverSelf: 0,
    leftoverChildren: 0,
    budgeted: 0,
    budgetedSelf: 0,
    budgetedChildren: 0,
    available: 0,
    availableSelf: 0,
    availableChildren: 0,
    overspend: 0,
    overspendSelf: 0,
    overspendChildren: 0,
  }
}
