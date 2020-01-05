import createSelector from 'selectorator'
import { getTransactionsByMonthAndType } from './getTransactionsByMonthAndType'
import { convertCurrency } from 'store/serverData'
import { getAccounts, getAccountsInBudget } from 'store/localData/accounts'

export const getTransfersOutsideBudget = createSelector(
  [
    getTransactionsByMonthAndType,
    getAccountsInBudget,
    getAccounts,
    convertCurrency,
  ],
  (transactions, accountsInBudget, accounts, convert) =>
    transactions.map(({ transfer }) => {
      const accountIds = accountsInBudget.map(acc => acc.id)
      const transfersFromBudget = transfer.filter(
        tr => !accountIds.includes(tr.incomeAccount)
      )
      const transfersToBudget = transfer.filter(
        tr => !accountIds.includes(tr.outcomeAccount)
      )
      const accsById = {}
      transfersFromBudget.forEach(tr => {
        const accId = tr.incomeAccount
        if (!accsById[accId]) {
          accsById[accId] = {
            ...accounts[accId],
            transfersFromBudget: 0,
            transfersToBudget: 0,
          }
        }
        accsById[accId].transfersFromBudget += convert(
          tr.outcome,
          tr.outcomeInstrument
        )
      })
      transfersToBudget.forEach(tr => {
        const accId = tr.outcomeAccount
        if (!accsById[accId]) {
          accsById[accId] = {
            ...accounts[accId],
            transfersFromBudget: 0,
            transfersToBudget: 0,
          }
        }
        accsById[accId].transfersToBudget += convert(
          tr.income,
          tr.incomeInstrument
        )
      })

      return Object.keys(accsById).map(id => accsById[id])
    })
)
