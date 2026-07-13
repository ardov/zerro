import { createSelector } from '@reduxjs/toolkit'
import { buildDebtors } from '../domain/zenmoney'
import * as accounts from './accounts'
import * as instruments from './instruments'
import * as merchants from './merchants'
import * as transactions from './transactions'

export const selectAll = createSelector(
  [
    transactions.selectHistory,
    merchants.selectAll,
    instruments.selectAll,
    accounts.selectDebtAccountId,
  ],
  (transactions, merchants, instruments, debtAccountId) =>
    buildDebtors({ transactions, merchants, instruments, debtAccountId })
)
