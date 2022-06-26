import { createSelector } from '@reduxjs/toolkit'
import { getDebtAccountId, getInBudgetAccounts } from 'models/accounts'
import { getTransactionsHistory } from 'models/transactions'
import { TSelector } from 'shared/types'
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
