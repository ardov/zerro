import { createSelector } from '@reduxjs/toolkit'
import { getDebtAccountId, getInBudgetAccounts } from 'store/data/accounts'
import { getTransactionsHistory } from 'store/data/transactions'
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
      console.log({ res })

      return res
    }
    // getRealMoneyFlow
  )
