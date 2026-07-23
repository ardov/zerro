import { describe, expect, it } from 'vitest'
import { makeDemoStore } from '../../support/demo'
import { makeTestRootState } from 'store/testing'
import { makeTransaction } from '../../support/testing/zenmoneyTestData'
import {
  selectDebtors,
  selectBalancesByDate,
  selectHistoryStart,
  selectInstCodeMap,
  selectInstruments,
  selectInstrumentsByCode,
  selectMerchants,
  selectTransactionIds,
  selectTransactions,
  selectTransactionsHistory,
} from '../../support/testing/reduxSelectors'

const NOW = Date.parse('2026-05-15T12:00:00Z')

const makeRootState = makeTestRootState

describe('Core transaction adapter reads', () => {
  it('exposes reference data through explicit Core contracts', () => {
    const state = makeRootState(makeDemoStore({ now: NOW }))
    const instruments = Object.values(state.data.current.instrument)

    expect(selectInstruments(state)).toBe(state.data.current.instrument)
    expect(selectInstrumentsByCode(state)).toEqual(
      Object.fromEntries(instruments.map(item => [item.shortTitle, item]))
    )
    expect(selectInstCodeMap(state)).toEqual(
      Object.fromEntries(instruments.map(item => [item.id, item.shortTitle]))
    )
    expect(selectMerchants(state)).toBe(state.data.current.merchant)
  })

  it('keeps transaction, debtor, and balance reads as direct Core contracts', async () => {
    const state = makeRootState(makeDemoStore({ now: NOW }))

    expect(selectTransactions(state)).toBe(state.data.current.transaction)
    expect(selectTransactionIds(state)).toHaveLength(
      Object.keys(state.data.current.transaction).length
    )
    expect(selectTransactionsHistory(state)).not.toHaveLength(0)
    expect(selectHistoryStart(state)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(selectDebtors(state)).toEqual(expect.any(Object))
    expect(selectBalancesByDate(state)).toEqual(expect.any(Array))
  })

  it('stays cached across unrelated data changes', () => {
    const store = makeDemoStore({ now: NOW })
    const history = selectTransactionsHistory(makeRootState(store))
    const ids = selectTransactionIds(makeRootState(store))
    const debtors = selectDebtors(makeRootState(store))
    const balancesByDate = selectBalancesByDate(makeRootState(store))
    const unrelatedChange = makeRootState({
      ...store,
      company: { ...store.company },
    })

    expect(selectTransactionsHistory(unrelatedChange)).toBe(history)
    expect(selectTransactionIds(unrelatedChange)).toBe(ids)
    expect(selectDebtors(unrelatedChange)).toBe(debtors)
    expect(selectBalancesByDate(unrelatedChange)).toBe(balancesByDate)
  })

  it('recomputes transaction-dependent projections when history changes', () => {
    const store = makeDemoStore({ now: NOW })
    const history = selectTransactionsHistory(makeRootState(store))
    const ids = selectTransactionIds(makeRootState(store))
    const debtors = selectDebtors(makeRootState(store))
    const balancesByDate = selectBalancesByDate(makeRootState(store))
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

    expect(selectTransactionsHistory(changed)).not.toBe(history)
    expect(selectTransactionIds(changed)).not.toBe(ids)
    expect(selectDebtors(changed)).not.toBe(debtors)
    expect(selectBalancesByDate(changed)).not.toBe(balancesByDate)
  })
})
