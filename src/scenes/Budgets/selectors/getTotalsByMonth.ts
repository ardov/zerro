import { createSelector } from '@reduxjs/toolkit'
import { getStartFunds } from './baseSelectors'
import {
  getAmountsByTag,
  getLinkedTransfers,
  getTransferFees,
} from './getAmountsByTag'
import { round } from 'helpers/currencyHelpers'
import getMonthDates from './getMonthDates'
import { withPerf } from 'helpers/performance'

interface TagTotals {
  budgeted: number
  income: number
  outcome: number
  overspent: number
  available: number
}
interface MonthTotals {
  date: number
  prevFunds: number
  prevOverspent: number
  toBeBudgeted: number
  budgetedInFuture: number // cannot be negative or greater than funds
  moneyInBudget: number // to check
  realBudgetedInFuture: number
  funds: number
  // TAGS
  budgeted: number
  income: number
  outcome: number
  overspent: number
  available: number
  // TRANSFERS
  transferOutcome: number
  transferFees: number
}

export const getTagTotals = createSelector(
  [getMonthDates, getAmountsByTag],
  withPerf('BUDGET: getTagTotals', (months, amounts): TagTotals[] =>
    months.map(month => {
      const totals = {
        budgeted: 0,
        income: 0,
        outcome: 0,
        overspent: 0,
        available: 0,
      }

      for (const id in amounts[month]) {
        totals.budgeted = round(
          totals.budgeted + amounts[month][id].totalBudgeted
        )
        totals.income = round(totals.income + amounts[month][id].totalIncome)
        totals.outcome = round(totals.outcome + amounts[month][id].totalOutcome)
        totals.overspent = round(
          totals.overspent + amounts[month][id].totalOverspent
        )
        totals.available = round(
          totals.available + amounts[month][id].totalAvailable
        )
      }
      return totals
    })
  )
)

export const getTotalsArray = createSelector(
  [
    getMonthDates,
    getStartFunds,
    getLinkedTransfers,
    getTransferFees,
    getTagTotals,
  ],
  withPerf(
    'BUDGET: getTotalsArray',
    (
      months,
      startFunds,
      linkedTransfers,
      transferFees,
      tagTotals
    ): MonthTotals[] => {
      let prevFunds = startFunds
      let prevOverspent = 0

      const totalsByMonth = months.map((date, i) => {
        const result = {
          date,
          prevFunds,
          prevOverspent,

          // TO DISPLAY
          get toBeBudgeted() {
            return this.funds - this.budgetedInFuture
          },
          // cannot be negative or greater than funds
          get budgetedInFuture() {
            const { funds, realBudgetedInFuture } = this
            if (realBudgetedInFuture <= 0 || funds <= 0) return 0
            return realBudgetedInFuture > funds ? funds : realBudgetedInFuture
          },

          // TO CHECK
          get moneyInBudget() {
            return round(this.funds + this.available)
          },

          realBudgetedInFuture: tagTotals
            .slice(i + 1)
            .reduce((sum, totals) => round(sum + totals.budgeted), 0),

          get funds() {
            return round(
              this.prevFunds -
                this.prevOverspent -
                this.budgeted +
                this.income -
                this.transferOutcome -
                this.transferFees
            )
          },

          // TAGS
          budgeted: tagTotals[i].budgeted,
          income: tagTotals[i].income,
          outcome: tagTotals[i].outcome,
          overspent: tagTotals[i].overspent,
          available: tagTotals[i].available,

          // TRANSFERS
          transferOutcome: linkedTransfers[date]?.null || 0,
          transferFees: transferFees[date] || 0,
        }

        prevFunds = result.funds
        prevOverspent = result.overspent
        return result
      })

      return totalsByMonth
    }
  )
)

export const getTotalsByMonth = createSelector([getTotalsArray], totals => {
  let result: { [key: number]: MonthTotals } = {}
  for (const monthData of totals) {
    result[monthData.date] = monthData
  }
  return result
})
