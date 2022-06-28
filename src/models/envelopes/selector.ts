import { createSelector } from '@reduxjs/toolkit'
import { TSelector } from 'models'
import { getDebtAccountId, getInBudgetAccounts } from 'models/account'
import { getTransactionsHistory } from 'models/transaction'
import { getRealMoneyFlow, TMoneyFlowByMonth } from './aggregated-transactions'

const getInBudgetAccIds = createSelector([getInBudgetAccounts], accounts =>
  accounts.map(acc => acc.id)
)
export const getAggregatedTransactions: TSelector<TMoneyFlowByMonth> =
  createSelector(
    [getTransactionsHistory, getInBudgetAccIds, getDebtAccountId],
    (transactions, inBudgetAccIds, debtAccId) => {
      let res = getRealMoneyFlow(transactions, inBudgetAccIds, debtAccId)
      return res
    }
  )
