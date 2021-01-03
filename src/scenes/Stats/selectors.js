import { createSelector } from '@reduxjs/toolkit'
import { round } from 'helpers/currencyHelpers'
import { getType } from 'store/localData/transactions/helpers'
import { getAccounts } from 'store/localData/accounts'
import { getSortedTransactions } from 'store/localData/transactions'
import { getStartBalance } from 'store/localData/accounts/helpers'
import { eachDayOfInterval, startOfDay } from 'date-fns'

export const getTransactionsHistory = createSelector(
  [getSortedTransactions],
  transactions => transactions.filter(tr => !tr.deleted).reverse()
)

export const getAccountsHistory = createSelector(
  [getTransactionsHistory, getAccounts],
  (transactions, accounts) => {
    if (!transactions?.length || !accounts) return {}
    const changes = {}
    const firstDate = new Date(transactions[0].date)
    const currentDate = startOfDay(new Date())
    const dateArray = eachDayOfInterval({ start: firstDate, end: currentDate })

    for (const id in accounts) {
      changes[id] = [
        {
          date: firstDate,
          balance: getStartBalance(accounts[id]),
          transactions: [],
        },
      ]
    }

    const addAmount = (amount, acc, date) => {
      const accHistory = changes[acc]
      const lastPoint = accHistory[accHistory.length - 1]
      if (lastPoint.date === date) {
        lastPoint.balance = round(lastPoint.balance + amount)
        lastPoint.transactions.push(amount)
      } else {
        accHistory.push({
          date,
          balance: round(lastPoint.balance + amount),
          transactions: [amount],
        })
      }
    }

    transactions.forEach(tr => {
      const { incomeAccount, outcomeAccount, income, outcome, date } = tr
      const type = getType(tr)

      switch (type) {
        case 'income':
          addAmount(income, incomeAccount, date)
          break

        case 'outcome':
          addAmount(-outcome, outcomeAccount, date)
          break

        case 'transfer':
          addAmount(income, incomeAccount, date)
          addAmount(-outcome, outcomeAccount, date)
          break

        default:
          throw new Error('unsupported type ' + type)
      }
    })

    let result = {}
    for (const id in changes) {
      let lastValue = 0
      const dateMap = {}
      changes[id].forEach(obj => {
        dateMap[obj.date] = obj
      })

      result[id] = dateArray.map(date => {
        const change = dateMap[+date]
        if (change) {
          lastValue = change.balance
          return change
        }
        return {
          date: +date,
          balance: lastValue,
          transactions: [],
        }
      })
    }

    return result
  }
)
