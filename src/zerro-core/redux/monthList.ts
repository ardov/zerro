import { createSelector } from '@reduxjs/toolkit'
import { buildMonthList } from '../domain/zerro'
import * as budgets from './budgets'
import { selectCurrentMonth } from './state'
import * as transactions from './transactions'

export const selectList = createSelector(
  [transactions.selectHistory, budgets.selectAll, selectCurrentMonth],
  (transactions, budgets, currentMonth) =>
    buildMonthList({ transactions, budgets, currentMonth })
)
