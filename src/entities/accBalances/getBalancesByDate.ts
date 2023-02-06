import { createSelector } from '@reduxjs/toolkit'
import { GroupBy, makeDateArray } from '@shared/helpers/date'

import { TSelector } from '@store/index'
import { displayCurrency } from '@entities/currency/displayCurrency'
import { trModel } from '@entities/transaction'
import { balancesToDisplay } from './shared/convertBalancesToDisplay'
import { TBalanceNode } from './shared/types'
import { getBalances } from './getBalances'

/**
 * This selector builds full history from first reasonable transaction.
 * Zenmoney may create transactions with date 1970-01-01.
 */
export const getBalancesByDate: TSelector<TBalanceNode[]> = createSelector(
  [getBalances, trModel.getHistoryStart],
  ({ byDay, startingBalances }, historyStart) => {
    let dates = makeDateArray(historyStart, Date.now(), GroupBy.Day)
    let lastUsedBalance = startingBalances
    return dates.map(date => {
      let balances = byDay[date] || lastUsedBalance
      lastUsedBalance = balances
      return { date, balances } as TBalanceNode
    })
  }
)

export const getDisplayBalancesByDate: TSelector<TBalanceNode<number>[]> =
  createSelector(
    [getBalancesByDate, displayCurrency.getConverter],
    balancesToDisplay
  )
