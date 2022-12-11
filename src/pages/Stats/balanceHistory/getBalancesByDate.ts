import { createSelector } from '@reduxjs/toolkit'
import { TISODate } from '@shared/types'
import { GroupBy, makeDateArray, toISODate } from '@shared/helpers/date'

import { trModel } from '@entities/transaction'
import {
  getBalanceHistory,
  getStartingBalances,
  TBalanceState,
} from './getBalanceHistory'
import { TSelector } from '@store/index'

const firstReasonableDate = '2000-01-01'

export const getBalancesByDate: TSelector<
  { date: TISODate; balances: TBalanceState }[]
> = createSelector(
  [trModel.getTransactionsHistory, getBalanceHistory, getStartingBalances],
  (trHistory, balanceStates, startingBalances) => {
    const reverseHistory = [...trHistory].reverse()
    let byDates: Record<TISODate, TBalanceState> = {}
    let currentDate: TISODate | null = null
    reverseHistory.forEach(tr => {
      if (currentDate === tr.date) return
      byDates[tr.date] = balanceStates[tr.id]
    })

    const firstDate =
      trHistory.find(tr => tr.date >= firstReasonableDate)?.date ||
      toISODate(new Date())

    const dateArray = makeDateArray(firstDate, Date.now(), GroupBy.Day)

    let lastBalanceState = startingBalances
    const balances = dateArray.map(date => {
      const node = {
        date,
        balances: byDates[date] || lastBalanceState,
      }
      lastBalanceState = node.balances
      return node
    })
    return balances
  }
)
