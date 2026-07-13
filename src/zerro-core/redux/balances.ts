import { createSelector } from '@reduxjs/toolkit'
import { buildBalances, buildBalancesByDate } from '../domain/zenmoney'
import * as accounts from './accounts'
import * as debtors from './debtors'
import * as instruments from './instruments'
import * as merchants from './merchants'
import { selectCurrentDate } from './state'
import * as transactions from './transactions'

export const selectAll = createSelector(
  [
    transactions.selectHistory,
    accounts.selectAll,
    debtors.selectAll,
    merchants.selectAll,
    instruments.selectCodeMap,
    accounts.selectDebtAccountId,
  ],
  (
    transactions,
    accounts,
    debtors,
    merchants,
    instrumentCodeById,
    debtAccountId
  ) =>
    buildBalances({
      transactions,
      accounts,
      debtors,
      merchants,
      instrumentCodeById,
      debtAccountId,
    })
)
export const selectByDate = createSelector(
  [selectAll, transactions.selectHistoryStart, selectCurrentDate],
  (balances, historyStart, currentDate) =>
    buildBalancesByDate({ balances, historyStart, currentDate })
)
