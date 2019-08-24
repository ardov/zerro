import createSelector from 'selectorator'
import { getStartFunds } from './baseSelectors'
import { getTransfersOutsideBudget } from './getTransfersOutsideBudget'
import { getTransferFeesByMonth } from './getTransferFeesByMonth'
import { getAmountsByTag } from './getAmountsByTag'
import { round } from 'helpers/currencyHelpers'
import getMonthDates from './getMonthDates'

export const getTotalBudgetedByMonth = createSelector(
  [getAmountsByTag],
  tagsByMonth =>
    tagsByMonth.map(tags =>
      tags.reduce((sum, tag) => round(sum + tag.totalBudgeted), 0)
    )
)

export const getTotalsByMonth = createSelector(
  [
    getMonthDates,
    getStartFunds,
    getAmountsByTag,
    getTransferFeesByMonth,
    getTransfersOutsideBudget,
    getTotalBudgetedByMonth,
  ],
  (moths, startFunds, tags, transferFees, transfersOutside, budgets) => {
    let prevFunds = startFunds
    let prevOverspent = 0
    return moths.map((date, i) => {
      const result = {
        date,
        prevFunds,
        prevOverspent,

        // TO DISPLAY
        get toBeBudgeted() {
          return this.funds - this.budgetedInFuture
        },

        // TO CHECK
        get moneyInBudget() {
          return this.funds + this.available
        },

        // TO DISPLAY
        // cannot be negative or greater than funds
        get budgetedInFuture() {
          const { funds, realBudgetedInFuture } = this
          if (realBudgetedInFuture <= 0 || funds <= 0) return 0
          return realBudgetedInFuture > funds ? funds : realBudgetedInFuture
        },

        realBudgetedInFuture: budgets
          .slice(i + 1)
          .reduce((sum, budgeted) => round(sum + budgeted), 0),

        get funds() {
          return round(
            this.prevFunds -
              this.prevOverspent -
              this.budgeted +
              this.income +
              this.transferIncome -
              this.transferOutcome -
              this.transferFees
          )
        },

        // BUDGETS
        budgeted: budgets[i],

        // TAGS
        income: tags[i].reduce((sum, tag) => round(sum + tag.totalIncome), 0),
        overspent: tags[i].reduce(
          (sum, tag) => round(sum + tag.totalOverspent),
          0
        ),
        available: tags[i].reduce(
          (sum, tag) => round(sum + tag.totalAvailable),
          0
        ),

        // TRANSFERS
        transferOutcome: transfersOutside[i].reduce(
          (sum, acc) => round(sum + acc.transfersFromBudget),
          0
        ),
        transferIncome: transfersOutside[i].reduce(
          (sum, acc) => round(sum + acc.transfersToBudget),
          0
        ),
        transferFees: transferFees[i],
      }
      prevFunds = result.funds
      prevOverspent = result.overspent
      return result
    })
  }
)
