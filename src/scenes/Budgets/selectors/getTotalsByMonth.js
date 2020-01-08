import createSelector from 'selectorator'
import { getStartFunds } from './baseSelectors'
import { getAmountsByTag } from './getAmountsByTag'
import { round } from 'helpers/currencyHelpers'
import getMonthDates from './getMonthDates'

export const getTotalBudgetedByMonth = createSelector(
  [getAmountsByTag],
  tagsByMonth =>
    tagsByMonth.map(({ tags }) =>
      tags.reduce((sum, tag) => round(sum + tag.totalBudgeted), 0)
    )
)

export const getTotalsByMonth = createSelector(
  [getMonthDates, getStartFunds, getAmountsByTag, getTotalBudgetedByMonth],
  (months, startFunds, tags, budgets) => {
    let prevFunds = startFunds
    let prevOverspent = 0
    return months.map((date, i) => {
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
        income: tags[i].tags.reduce(
          (sum, tag) => round(sum + tag.totalIncome),
          0
        ),
        overspent: tags[i].tags.reduce(
          (sum, tag) => round(sum + tag.totalOverspent),
          0
        ),
        available: tags[i].tags.reduce(
          (sum, tag) => round(sum + tag.totalAvailable),
          0
        ),

        // TRANSFERS
        transferOutcome: tags[i].transferOutcome,
        transferIncome: 0,
        transferFees: tags[i].transferFees,
      }
      prevFunds = result.funds
      prevOverspent = result.overspent
      return result
    })
  }
)

// [WIP]
// class MonthBudget {
//   constructor({
//     date,
//     prevFunds,
//     prevOverspent,
//     realBudgetedInFuture,
//     tags,
//     transferOutcome,
//     transferFees,
//   }) {
//     this.date = date
//     this.prevFunds = prevFunds
//     this.prevOverspent = prevOverspent
//     this.realBudgetedInFuture = realBudgetedInFuture
//     this.tags = tags
//     this.transferOutcome = transferOutcome
//     this.transferFees = transferFees
//   }

//   // TAGS
//   get income() {
//     return this.tags.reduce((sum, tag) => round(sum + tag.totalIncome), 0)
//   }
//   get budgeted() {
//     return this.tags.reduce((sum, tag) => round(sum + tag.totalBudgeted), 0)
//   }
//   get overspent() {
//     return this.tags.reduce((sum, tag) => round(sum + tag.totalOverspent), 0)
//   }
//   get available() {
//     return this.tags.reduce((sum, tag) => round(sum + tag.totalAvailable), 0)
//   }

//   // TO DISPLAY
//   get toBeBudgeted() {
//     return this.funds - this.budgetedInFuture
//   }

//   // TO CHECK
//   get moneyInBudget() {
//     return this.funds + this.available
//   }

//   // TO DISPLAY
//   // cannot be negative or greater than funds
//   get budgetedInFuture() {
//     const { funds, realBudgetedInFuture } = this
//     if (realBudgetedInFuture <= 0 || funds <= 0) return 0
//     return realBudgetedInFuture > funds ? funds : realBudgetedInFuture
//   }

//   // FUNDS
//   get funds() {
//     return round(
//       this.prevFunds -
//         this.prevOverspent -
//         this.budgeted +
//         this.income +
//         this.transferIncome -
//         this.transferOutcome -
//         this.transferFees
//     )
//   }
// }
