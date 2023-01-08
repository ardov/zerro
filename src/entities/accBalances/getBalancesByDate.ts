import { TISODate } from '@shared/types'
import { GroupBy, makeDateArray, toISODate } from '@shared/helpers/date'
import { entries, keys } from '@shared/helpers/keys'

import { getBalances } from './getBalances'
import { createSelector } from '@reduxjs/toolkit'
import { displayCurrency } from '@entities/currency/displayCurrency'
import { trModel } from '@entities/transaction'

/**
 * Zenmoney may create transactions with date 1970-01-01.
 * This selector builds full history from that first transactions.
 */
export const getBalancesByDateFull = createSelector(
  [getBalances],
  ({ byDay, startingBalances }) => {
    let dates = keys(byDay).sort()
    let reverseDates = keys(byDay).sort().reverse()
    let firstDate = dates[0] || toISODate(Date.now())

    return makeDateArray(firstDate, Date.now(), GroupBy.Day).map(date => {
      return { date, balances: findBalances(date) }
    })

    function findBalances(date: TISODate) {
      let key = reverseDates.find(key => key <= date)
      return key ? byDay[key] : startingBalances
    }
  }
)

export const getBalancesByDate = createSelector(
  [getBalancesByDateFull, trModel.getHistoryStart],
  (balances, historyStart) =>
    balances.filter(({ date }) => date >= historyStart)
)

export const getDisplayBalancesByDate = createSelector(
  [getBalancesByDate, displayCurrency.getConverter],
  (balances, convert) => {
    return balances.map(({ date, balances }) => {
      let newPoint = {
        date,
        balances: {
          accounts: Object.fromEntries(
            entries(balances.accounts).map(([id, amount]) => [
              id,
              convert(amount, date),
            ])
          ),
          debtors: Object.fromEntries(
            entries(balances.debtors).map(([id, amount]) => [
              id,
              convert(amount, date),
            ])
          ),
        },
      }
      return newPoint
    })
  }
)
