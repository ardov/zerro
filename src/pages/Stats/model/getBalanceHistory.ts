import { createSelector } from '@reduxjs/toolkit'
import { getTransactionsHistory } from '@entities/transaction'
import {
  AccountType,
  TAccountId,
  TFxAmount,
  TTransactionId,
} from '@shared/types'
import { TSelector } from '@store/index'
import { debtorModel } from '@entities/debtors'
import { accountModel } from '@entities/account'
import { isZero, subFxAmount } from '@shared/helpers/money'
import { getBalanceChanges, TTrEffect } from './getBalanceChanges'

type TBalanceState = {
  accounts: Record<TAccountId, TFxAmount>
  debtors: Record<string, TFxAmount>
}

export const getBalanceHistory: TSelector<
  Record<TTransactionId, TBalanceState>
> = createSelector(
  [
    getTransactionsHistory,
    getBalanceChanges,
    accountModel.getPopulatedAccounts,
    debtorModel.getDebtors,
  ],
  (trHistory, changes, accounts, debtors) => {
    const result: Record<TTransactionId, TBalanceState> = {}

    const accBalances: Record<TAccountId, TFxAmount> = {}
    Object.values(accounts).forEach(acc => {
      if (acc.type === AccountType.Debt) return
      accBalances[acc.id] = { [acc.fxCode]: acc.startBalanceReal }
    })

    const debtorBalances: Record<string, TFxAmount> = {}
    Object.values(debtors).forEach(debtor => {
      debtorBalances[debtor.id] = debtor.balance
    })

    const reverseHistory = [...trHistory].reverse()
    let lastState: TBalanceState = {
      accounts: accBalances,
      debtors: debtorBalances,
    }
    reverseHistory.forEach(tr => {
      result[tr.id] = lastState
      lastState = substractChange(lastState, changes[tr.id])
    })

    Object.values(lastState.debtors).forEach(amount => {
      console.assert(isZero(amount), 'Starting amount of debtor is not zero')
    })

    return result
  }
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
