import { createSelector } from '@reduxjs/toolkit'
import {
  AccountType,
  TAccountId,
  TFxAmount,
  TTransactionId,
} from '@shared/types'
import { isZero, subFxAmount } from '@shared/helpers/money'
import { withPerf } from '@shared/helpers/performance'

import { TSelector } from '@store/index'
import { trModel } from '@entities/transaction'
import { debtorModel } from '@entities/debtors'
import { accountModel } from '@entities/account'
import { getBalanceChanges, TTrEffect } from './getBalanceChanges'

export type TBalanceState = {
  accounts: Record<TAccountId, TFxAmount>
  debtors: Record<string, TFxAmount>
}

const getBalances = createSelector(
  [
    trModel.getTransactionsHistory,
    getBalanceChanges,
    accountModel.getPopulatedAccounts,
    debtorModel.getDebtors,
  ],
  withPerf('getBalances', (trHistory, changes, accounts, debtors) => {
    const balancesAfter: Record<TTransactionId, TBalanceState> = {}

    // Current account balances
    const accBalances: Record<TAccountId, TFxAmount> = {}
    Object.values(accounts).forEach(acc => {
      if (acc.type === AccountType.Debt) return
      accBalances[acc.id] = { [acc.fxCode]: acc.balance }
    })

    // Current debtor balances
    const debtorBalances: Record<string, TFxAmount> = {}
    Object.values(debtors).forEach(debtor => {
      debtorBalances[debtor.id] = debtor.balance
    })

    // New first
    const reverseHistory = [...trHistory].reverse()
    let lastState: TBalanceState = {
      accounts: accBalances,
      debtors: debtorBalances,
    }
    reverseHistory.forEach(tr => {
      balancesAfter[tr.id] = lastState
      lastState = substractChange(lastState, changes[tr.id])
    })

    const startingBalances = lastState

    // Double check
    Object.values(startingBalances.debtors).forEach(amount => {
      console.assert(isZero(amount), 'Starting amount of debtor is not zero')
    })

    return { balancesAfter, startingBalances }
  })
)

export const getBalanceHistory: TSelector<
  Record<TTransactionId, TBalanceState>
> = createSelector([getBalances], b => b.balancesAfter)

export const getStartingBalances: TSelector<TBalanceState> = createSelector(
  [getBalances],
  b => b.startingBalances
)

function substractChange(
  state: TBalanceState,
  change: TTrEffect
): TBalanceState {
  const newState = {
    accounts: { ...state.accounts },
    debtors: { ...state.debtors },
  }
  Object.entries(change.accounts || {}).forEach(([id, amount]) => {
    newState.accounts[id] = subFxAmount(newState.accounts[id], amount)
  })
  Object.entries(change.debtors || {}).forEach(([id, amount]) => {
    newState.debtors[id] = subFxAmount(newState.debtors[id], amount)
  })
  return newState
}
