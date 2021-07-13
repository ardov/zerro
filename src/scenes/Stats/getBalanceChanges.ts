import { createSelector } from '@reduxjs/toolkit'
import { round } from 'helpers/currencyHelpers'
import { getTime, getType } from 'store/localData/transactions/helpers'
import { getAccounts, getDebtAccountId } from 'store/localData/accounts'
import { getTransactionsHistory } from 'store/localData/transactions'

type HistoryPoint = {
  date: number
  accounts: {
    [account: string]: number
  }
  merchants: {
    [merchant: string]: {
      [instrument: string]: number
    }
  }
  payees: {
    [payee: string]: {
      [instrument: string]: number
    }
  }
}

export const getBalancesOnDate = (nodes: HistoryPoint[], date: number) => {
  // TODO: improve with binary search
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (nodes[i].date <= date) return nodes[i]
  }
}

/**
 * Returns an array of balance changes created for every transaction from getTransactionsHistory
 */
export const getBalanceChanges = createSelector(
  [getTransactionsHistory, getDebtAccountId, getAccounts],
  (transactions, debtId, accounts) => {
    let prevPoint: HistoryPoint = {
      date: 0,
      accounts: Object.fromEntries(
        Object.entries(accounts)
          .filter(val => val[1].type !== 'debt')
          .map(val => [val[0], val[1].startBalance])
      ),
      merchants: {},
      payees: {},
    }
    const history = transactions.map(transaction => {
      const {
        income,
        outcome,
        merchant,
        payee,
        incomeAccount,
        outcomeAccount,
        incomeInstrument,
        outcomeInstrument,
      } = transaction
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
          addDebt(-outcome, outcomeInstrument)
          break
        case 'outcomeDebt':
          addDebt(income, incomeInstrument)
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
      function addDebt(change: number, instrument: number) {
        if (merchant) {
          point.merchants[merchant] ??= { [instrument]: 0 }
          point.merchants[merchant][instrument] = round(
            point.merchants[merchant][instrument] + change
          )
        } else if (payee) {
          point.payees[payee] ??= { [instrument]: 0 }
          point.payees[payee][instrument] = round(
            point.payees[payee][instrument] + change
          )
        } else {
          console.error('No debtor', transaction)
        }
      }
    })

    if (history.length) return history
    // return point with startBalances for every account
    return [prevPoint]
  }
)

const clonePoint = (point: HistoryPoint) =>
  JSON.parse(JSON.stringify(point)) as HistoryPoint
