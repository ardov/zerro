import createSelector from 'selectorator'
import startOfMonth from 'date-fns/startOfMonth'
import { getType } from 'store/data/transactions/helpers'
import getMonthDates from './getMonthDates'
import { getTransactionsInBudget } from './baseSelectors'

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
