import createSelector from 'selectorator'
import startOfMonth from 'date-fns/startOfMonth'
import { getType } from 'store/data/transactions/helpers'
import getMonthDates from './getMonthDates'
import { getTransactionsInBudget } from './baseSelectors'

/**
 * @typedef {Object} Transactions something
 * @property {number} date Start of month in ms
 * @property {Array} income Array of transactions
 * @property {Array} outcome Array of transactions
 * @property {Array} transfer Array of transactions
 */

/**
 * Group transactions in budget by type for each month
 * @returns {Transactions} transactions by type
 */
export const getTransactionsByMonthAndType = createSelector(
  [getMonthDates, getTransactionsInBudget],
  (monthDates, transactions) =>
    monthDates.map(date =>
      transactions
        .filter(tr => +startOfMonth(tr.date) === +date)
        .reduce(
          (sorted, tr) => {
            sorted[getType(tr)].push(tr)
            return sorted
          },
          { date, income: [], outcome: [], transfer: [] }
        )
    )
)
