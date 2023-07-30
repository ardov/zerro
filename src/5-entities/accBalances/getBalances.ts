import { createSelector } from '@reduxjs/toolkit'
import { AccountType, ById, TISODate, TTransactionId } from '6-shared/types'
import { withPerf } from '6-shared/helpers/performance'
import { entries } from '6-shared/helpers/keys'
import { isZero, subFxAmount } from '6-shared/helpers/money'

import { TSelector } from 'store/index'
import { trModel } from '5-entities/transaction'
import { debtorModel, TDebtor } from '5-entities/debtors'
import { accountModel, TAccountPopulated } from '5-entities/account'
import { TBalanceState } from './shared/types'
import { TTrEffect, getConverterToChange } from './getConverterToChange'

/**
 * Returns balances
 * - `byDay` — balances at the end of the day with transactions
 * - `byTransaction` — balances just after transaction happened
 * - `startingBalances` — balances before any transaction happened
 */
export const getBalances: TSelector<{
  byDay: Record<TISODate, TBalanceState>
  byTransaction: Record<TTransactionId, TBalanceState>
  startingBalances: TBalanceState
}> = createSelector(
  [
    trModel.getTransactionsHistory,
    getConverterToChange,
    accountModel.getPopulatedAccounts,
    debtorModel.getDebtors,
  ],
  withPerf(
    'getBalances',
    (transactions, convertToChange, accounts, debtors) => {
      let byDay: Record<TISODate, TBalanceState> = {}
      let byTransaction: Record<TTransactionId, TBalanceState> = {}
      let lastState = getCurrentBalanceState(accounts, debtors)

      for (let i = transactions.length - 1; i >= 0; i--) {
        let change = convertToChange(transactions[i])
        let { id, date } = change
        byDay[date] = byDay[date] || lastState
        byTransaction[id] = lastState
        lastState = substractChange(lastState, change)
      }

      // Check that all debtors start with zero balances
      Object.values(lastState.debtors).forEach(amount => {
        console.assert(isZero(amount), 'Starting amount of debtor is not zero')
      })

      return { byDay, byTransaction, startingBalances: lastState }
    }
  )
)

/*
===============================================================================
=================================== Helpers ===================================
===============================================================================
*/

/** Returns balances as they were before transaction */
function substractChange(
  state: TBalanceState,
  change: TTrEffect
): TBalanceState {
  let nextState: TBalanceState = { ...state }
  if (change.accounts) {
    nextState.accounts = { ...nextState.accounts }
    entries(change.accounts).forEach(([id, amount]) => {
      nextState.accounts[id] = subFxAmount(nextState.accounts[id], amount)
    })
  }
  if (change.debtors) {
    nextState.debtors = { ...nextState.debtors }
    entries(change.debtors).forEach(([id, amount]) => {
      nextState.debtors[id] = subFxAmount(nextState.debtors[id], amount)
    })
  }
  return nextState
}

/** Returns current balances for all accounts and debtors */
function getCurrentBalanceState(
  accounts: ById<TAccountPopulated>,
  debtors: ById<TDebtor>
): TBalanceState {
  let result: TBalanceState = {
    accounts: {},
    debtors: {},
  }
  Object.values(accounts).forEach(acc => {
    if (acc.type === AccountType.Debt) return
    result.accounts[acc.id] = { [acc.fxCode]: acc.balance }
  })
  Object.values(debtors).forEach(debtor => {
    result.debtors[debtor.id] = debtor.balance
  })
  return result
}
