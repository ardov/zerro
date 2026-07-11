import { describe, expect, it, vi } from 'vitest'
import type { TDataStore } from '6-shared/types'
import type { RootState } from 'store'
import { makeDemoStore } from '../../demo'
import { makeTransaction } from '../../testing/zenmoneyTestData'
import {
  selectCoreDebtors,
  selectCoreBalancesByDate,
  selectCoreHistoryStart,
  selectCoreTransactionIds,
  selectCoreTransactions,
  selectCoreTransactionsHistory,
} from './selectors'

// LEGACY-PARITY BRIDGE: remove model-to-model comparisons as each matching
// transaction/debtor/balance legacy read loses its last production consumer.
// Keep the demo outputs and invalidation cases as explicit Core contracts.

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
      outbox: [],
      outboxHead: 0,
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
  it('matches legacy transaction map, IDs, history, debtors, and balance history', async () => {
    const [
      { accBalanceModel },
      { debtorModel },
      {
        getTransactionsById,
        getTransactionIds,
        getTransactionsHistory,
        getHistoryStart,
      },
    ] = await Promise.all([
      import('5-entities/accBalances'),
      import('5-entities/debtors'),
      import('5-entities/transaction/model'),
    ])
    const state = makeRootState(makeDemoStore({ now: NOW }))

    expect(selectCoreTransactions(state)).toBe(getTransactionsById(state))
    expect(selectCoreTransactionIds(state)).toEqual(getTransactionIds(state))
    expect(selectCoreTransactionsHistory(state)).toEqual(
      getTransactionsHistory(state)
    )
    expect(selectCoreHistoryStart(state)).toEqual(getHistoryStart(state))
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
