import { describe, expect, it, vi } from 'vitest'
import type { TDataStore } from '6-shared/types'
import type { RootState } from 'store'
import { makeDemoStore } from '../../demo'
import { makeTransaction } from '../../testing/zenmoneyTestData'
import { accBalanceModel } from '5-entities/accBalances'
import { debtorModel } from '5-entities/debtors'
import { trModel } from '5-entities/transaction'
import {
  selectCoreDebtors,
  selectCoreBalancesByDate,
  selectCoreHistoryStart,
  selectCoreTransactionIds,
  selectCoreTransactions,
  selectCoreTransactionsHistory,
} from './selectors'

// Breaks the legacy hidden-store import cycle while loading the parity source.
vi.mock('5-entities/shared/hidden-store/dataAccount', () => ({
  DATA_ACC_NAME: '🤖 [Zerro Data]',
  getDataAccountId: () => undefined,
  prepareDataAccount: () => {
    throw new Error('prepareDataAccount is not available in this test')
  },
}))

const NOW = Date.parse('2026-05-15T12:00:00Z')

function makeRootState(data: TDataStore): RootState {
  return {
    data: {
      current: data,
      base: data,
    },
    displayCurrency: null,
    isPending: false,
    lastSync: {
      finishedAt: 0,
      isSuccessful: null,
      errorMessage: null,
    },
    token: null,
  }
}

describe('Core transaction adapter reads', () => {
  it('matches legacy transaction map, IDs, history, debtors, and balance history', () => {
    const state = makeRootState(makeDemoStore({ now: NOW }))

    expect(selectCoreTransactions(state)).toBe(trModel.getTransactionsById(state))
    expect(selectCoreTransactionIds(state)).toEqual(trModel.getTransactionIds(state))
    expect(selectCoreTransactionsHistory(state)).toEqual(
      trModel.getTransactionsHistory(state)
    )
    expect(selectCoreHistoryStart(state)).toEqual(trModel.getHistoryStart(state))
    expect(selectCoreDebtors(state)).toEqual(debtorModel.getDebtors(state))
    expect(selectCoreBalancesByDate(state)).toEqual(
      accBalanceModel.getBalancesByDate(state)
    )
  })

  it('stays cached across unrelated data changes', () => {
    const store = makeDemoStore({ now: NOW })
    const history = selectCoreTransactionsHistory(makeRootState(store))
    const ids = selectCoreTransactionIds(makeRootState(store))
    const debtors = selectCoreDebtors(makeRootState(store))
    const balancesByDate = selectCoreBalancesByDate(makeRootState(store))
    const unrelatedChange = makeRootState({
      ...store,
      company: { ...store.company },
    })

    expect(selectCoreTransactionsHistory(unrelatedChange)).toBe(history)
    expect(selectCoreTransactionIds(unrelatedChange)).toBe(ids)
    expect(selectCoreDebtors(unrelatedChange)).toBe(debtors)
    expect(selectCoreBalancesByDate(unrelatedChange)).toBe(balancesByDate)
  })

  it('recomputes transaction-dependent projections when history changes', () => {
    const store = makeDemoStore({ now: NOW })
    const history = selectCoreTransactionsHistory(makeRootState(store))
    const ids = selectCoreTransactionIds(makeRootState(store))
    const debtors = selectCoreDebtors(makeRootState(store))
    const balancesByDate = selectCoreBalancesByDate(makeRootState(store))
    const transaction = makeTransaction({
      id: 'core-adapter-transaction',
      date: '2026-05-16',
      created: NOW,
      income: 1,
    })
    const changed = makeRootState({
      ...store,
      transaction: { ...store.transaction, [transaction.id]: transaction },
    })

    expect(selectCoreTransactionsHistory(changed)).not.toBe(history)
    expect(selectCoreTransactionIds(changed)).not.toBe(ids)
    expect(selectCoreDebtors(changed)).not.toBe(debtors)
    expect(selectCoreBalancesByDate(changed)).not.toBe(balancesByDate)
  })
})
