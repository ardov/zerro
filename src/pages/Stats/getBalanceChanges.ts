import { createSelector } from '@reduxjs/toolkit'
import { round } from 'shared/helpers/money'
import { getTime, getType } from 'models/transaction/helpers'
import { getAccounts, getDebtAccountId, getStartBalance } from 'models/account'
import { debtorGetter, getTransactionsHistory } from 'models/transaction'

type HistoryPoint = {
  date: number
  accounts: { [account: string]: number }
  debtors: { [debtorId: string]: number }
}

export const getBalancesOnDate = (nodes: HistoryPoint[], date: number) => {
  // TODO: improve with binary search
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (nodes[i].date <= date) return nodes[i]
  }
  return nodes[0]
}

/**
 * Returns an array of balance changes created for every transaction from getTransactionsHistory
 */
export const getBalanceChanges = createSelector(
  [getTransactionsHistory, getDebtAccountId, getAccounts, debtorGetter],
  (transactions, debtId, accounts, getDebtorId) => {
    let prevPoint: HistoryPoint = {
      date: 0,
      accounts: Object.fromEntries(
        Object.entries(accounts)
          .filter(([id, acc]) => acc.type !== 'debt')
          .map(([id, acc]) => [id, getStartBalance(acc)])
      ),
      debtors: {},
    }
    const history = transactions.map(transaction => {
      const { income, outcome, incomeAccount, outcomeAccount } = transaction
      const type = getType(transaction, debtId)
      const point = clonePoint(prevPoint)
      point.date = +getTime(transaction)

      switch (type) {
        case 'income':
          addToAccount(income, incomeAccount)
          break
        case 'outcome':
          addToAccount(-outcome, outcomeAccount)
          break
        case 'transfer':
          addToAccount(income, incomeAccount)
          addToAccount(-outcome, outcomeAccount)
          break
        case 'incomeDebt':
          addToAccount(income, incomeAccount)
          addDebt(-outcome, getDebtorId(transaction))
          break
        case 'outcomeDebt':
          addDebt(income, getDebtorId(transaction))
          addToAccount(-outcome, outcomeAccount)
          break
        default:
          throw new Error('Unknown transaction type: ' + type)
      }

      prevPoint = point
      return point

      // Helpers

      function addToAccount(change: number, account: string) {
        point.accounts[account] = round(point.accounts[account] + change)
      }
      function addDebt(change: number, debtorId: string) {
        point.debtors[debtorId] ??= 0
        point.debtors[debtorId] = round(point.debtors[debtorId] + change)
      }
    })

    if (history.length) return history
    // return point with startBalances for every account
    return [prevPoint]
  }
)

const clonePoint = (point: HistoryPoint) =>
  JSON.parse(JSON.stringify(point)) as HistoryPoint
