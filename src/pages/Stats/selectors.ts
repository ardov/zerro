import { createSelector } from '@reduxjs/toolkit'
import { round } from '@shared/helpers/money'
import { getPopulatedAccounts } from '@entities/account'
import { getTransactionsHistory } from '@entities/transaction'
import { TAccountId, TISODate } from '@shared/types'
import { keys } from '@shared/helpers/keys'
import {
  eachDayOfInterval,
  parseDate,
  startOfDay,
  toISODate,
} from '@shared/helpers/date'

type Point = {
  date: TISODate
  balance: number
  transactions: number[]
}

export const getAccountsHistory = createSelector(
  [getTransactionsHistory, getPopulatedAccounts],
  (transactions, accounts) => {
    if (!accounts) return {}
    const firstDate = transactions[0]
      ? parseDate(transactions[0].date)
      : startOfDay(new Date())

    // Make array of balance changes by day (from transactions)
    const changes: Record<TAccountId, Point[]> = {}
    keys(accounts).forEach(id => {
      changes[id] = [
        {
          date: toISODate(firstDate),
          balance: accounts[id].startBalanceReal,
          transactions: [],
        },
      ]
    })

    transactions.forEach(tr => {
      const { incomeAccount, outcomeAccount, income, outcome, date } = tr
      if (incomeAccount) addAmount(income, incomeAccount, date)
      if (outcomeAccount) addAmount(-outcome, outcomeAccount, date)
    })

    // Make date points for each day from the first transaction till now
    const dateArray = eachDayOfInterval(firstDate, startOfDay(new Date())).map(
      toISODate
    )

    // Fill the missing dates so all accounts have eual number of points
    let result: Record<TAccountId, Point[]> = {}
    for (const id in changes) {
      let lastValue = 0
      const dateMap: Record<
        TAccountId,
        {
          date: TISODate
          balance: number
          transactions: number[]
        }
      > = {}
      changes[id].forEach(obj => {
        dateMap[obj.date] = obj
      })

      result[id] = dateArray.map(date => {
        const change = dateMap[date]
        if (change) {
          lastValue = change.balance
          return change
        }
        return {
          date,
          balance: lastValue,
          transactions: [],
        }
      })
    }

    return result

    function addAmount(amount: number, acc: string, date: TISODate) {
      const accChanges = changes[acc]
      const lastPoint = accChanges[accChanges.length - 1]

      if (lastPoint.date === date) {
        lastPoint.balance = round(lastPoint.balance + amount)
        lastPoint.transactions.push(amount)
        return
      }

      accChanges.push({
        date,
        balance: round(lastPoint.balance + amount),
        transactions: [amount],
      })
    }
  }
)
