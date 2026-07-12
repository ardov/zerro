import { describe, expect, it } from 'vitest'
import type { TDataStore } from '6-shared/types'
import type { RootState } from 'store'
import { makeDemoStore } from '../demo'
import { makeTransaction } from '../testing/zenmoneyTestData'
import {
  selectCoreDebtors,
  selectCoreBalancesByDate,
  selectCoreHistoryStart,
  selectCoreInstCodeMap,
  selectCoreInstruments,
  selectCoreInstrumentsByCode,
  selectCoreMerchants,
  selectCoreTransactionIds,
  selectCoreTransactions,
  selectCoreTransactionsHistory,
} from './selectors'

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
  it('exposes reference data through explicit Core contracts', () => {
    const state = makeRootState(makeDemoStore({ now: NOW }))
    const instruments = Object.values(state.data.current.instrument)

    expect(selectCoreInstruments(state)).toBe(state.data.current.instrument)
    expect(selectCoreInstrumentsByCode(state)).toEqual(
      Object.fromEntries(instruments.map(item => [item.shortTitle, item]))
    )
    expect(selectCoreInstCodeMap(state)).toEqual(
      Object.fromEntries(instruments.map(item => [item.id, item.shortTitle]))
    )
    expect(selectCoreMerchants(state)).toBe(state.data.current.merchant)
  })

  it('keeps transaction, debtor, and balance reads as direct Core contracts', async () => {
    const state = makeRootState(makeDemoStore({ now: NOW }))

    expect(selectCoreTransactions(state)).toBe(state.data.current.transaction)
    expect(selectCoreTransactionIds(state)).toHaveLength(
      Object.keys(state.data.current.transaction).length
    )
    expect(selectCoreTransactionsHistory(state)).not.toHaveLength(0)
    expect(selectCoreHistoryStart(state)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(selectCoreDebtors(state)).toEqual(expect.any(Object))
    expect(selectCoreBalancesByDate(state)).toEqual(expect.any(Array))
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
