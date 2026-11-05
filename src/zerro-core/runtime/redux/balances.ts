import { createSelector } from '@reduxjs/toolkit'
import { endOfMonth } from 'date-fns'
import type { RootState } from '@/store'
import {
  parseDate,
  toISODate,
  toISOMonth,
} from '../../internal/domain/foundation/date'
import type {
  TISODate,
  TISOMonth,
} from '../../internal/domain/foundation/primitives'
import { fromGraph, graph } from './graph'

export const selectAll = fromGraph(graph.balances)
export const selectByDate = fromGraph(graph.balancesByDate)
const selectMonthEndOnDay = createSelector(
  [
    fromGraph(graph.balancesAtDate),
    fromGraph(graph.historyStart),
    (_: RootState, month: TISOMonth) => month,
    (_: RootState, _month: TISOMonth, today: TISODate) => today,
  ],
  (atDate, start, month, today) => {
    const currentMonth = toISOMonth(today)
    if (month < toISOMonth(start) || month > currentMonth) return undefined
    const date =
      month === currentMonth ? today : toISODate(endOfMonth(parseDate(month)))
    return atDate(date)
  }
)
export const selectMonthEnd = (state: RootState, month: TISOMonth) =>
  selectMonthEndOnDay(state, month, graph.currentDate())
export {
  convertBalancesToDisplay as convertToDisplay,
  type TBalanceNode,
} from '../../internal/domain/zenmoney/read-models/balances'
