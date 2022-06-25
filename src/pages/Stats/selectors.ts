import { createSelector } from '@reduxjs/toolkit'
import { round } from 'shared/helpers/currencyHelpers'
import { getAccounts, getStartBalance } from 'models/accounts'
import { getTransactionsHistory } from 'models/transactions'
import { eachDayOfInterval, startOfDay } from 'date-fns'
import { ById } from 'shared/types'

type Point = {
  date: number
  balance: number
  transactions: number[]
}

export const getAccountsHistory = createSelector(
  [getTransactionsHistory, getAccounts],
  (transactions, accounts) => {
    if (!accounts) return {}
    const firstDate = transactions[0]
      ? new Date(transactions[0].date)
      : startOfDay(new Date())
    const currentDate = startOfDay(new Date())
    const dateArray = eachDayOfInterval({ start: firstDate, end: currentDate })

    const changes: ById<Point[]> = {}
    Object.keys(accounts).forEach(id => {
      changes[id] = [
        {
          date: +firstDate,
          balance: getStartBalance(accounts[id]),
          transactions: [],
        },
      ]
    })

    transactions.forEach(tr => {
      const { incomeAccount, outcomeAccount, income, outcome, date } = tr
      if (incomeAccount) addAmount(income, incomeAccount, date)
      if (outcomeAccount) addAmount(-outcome, outcomeAccount, date)
    })

    let result: ById<Point[]> = {}
    for (const id in changes) {
      let lastValue = 0
      const dateMap: ById<{
        date: number
        balance: number
        transactions: number[]
      }> = {}
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

    function addAmount(amount: number, acc: string, date: number) {
      const accChanges = changes[acc]
      const lastPoint = accChanges[accChanges.length - 1]
      if (lastPoint.date === date) {
        lastPoint.balance = round(lastPoint.balance + amount)
        lastPoint.transactions.push(amount)
      } else {
        accChanges.push({
          date,
          balance: round(lastPoint.balance + amount),
          transactions: [amount],
        })
      }
    }
  }
)
