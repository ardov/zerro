import createSelector from 'selectorator'
import { getTransactionsByMonthAndType } from './getTransactionsByMonthAndType'
import { getAccountsInBudget } from './baseSelectors'
import { convertCurrency } from 'store/data/instruments'
import { round } from 'helpers/currencyHelpers'

export const getTransferFeesByMonth = createSelector(
  [getTransactionsByMonthAndType, getAccountsInBudget, convertCurrency],
  (transactions, accountsInBudget, convert) =>
    transactions.map(({ transfer }) => {
      const accountIds = accountsInBudget.map(acc => acc.id)

      return transfer
        .filter(
          tr =>
            accountIds.includes(tr.outcomeAccount) &&
            accountIds.includes(tr.incomeAccount)
        )
        .reduce(
          (sum, tr) =>
            round(
              sum +
                convert(tr.outcome, tr.outcomeInstrument) -
                convert(tr.income, tr.incomeInstrument)
            ),
          0
        )
    })
)
