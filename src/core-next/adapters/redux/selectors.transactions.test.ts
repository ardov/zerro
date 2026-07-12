import { describe, expect, it, vi } from 'vitest'
import type { TDataStore } from '6-shared/types'
import type { RootState } from 'store'
import { makeDemoStore } from '../../demo'
import { makeTransaction } from '../../testing/zenmoneyTestData'
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
  it('matches legacy reference-data selectors', async () => {
    const [instrument, merchant] = await Promise.all([
      import('5-entities/currency/instrument'),
      import('5-entities/merchant'),
    ])
    const state = makeRootState(makeDemoStore({ now: NOW }))

    expect(selectCoreInstruments(state)).toBe(instrument.getInstruments(state))
    expect(selectCoreInstrumentsByCode(state)).toEqual(
      instrument.getInstrumentsByCode(state)
    )
    expect(selectCoreInstCodeMap(state)).toEqual(
      instrument.getInstCodeMap(state)
    )
    expect(selectCoreMerchants(state)).toBe(merchant.getMerchants(state))
  })

  it('keeps transaction reads as direct Core contracts and preserves legacy balance projections', async () => {
    const [{ getBalancesByDate }, { getDebtors }] = await Promise.all([
      import('5-entities/accBalances'),
      import('5-entities/debtors'),
    ])
    const state = makeRootState(makeDemoStore({ now: NOW }))

    expect(selectCoreTransactions(state)).toBe(state.data.current.transaction)
    expect(selectCoreTransactionIds(state)).toHaveLength(
      Object.keys(state.data.current.transaction).length
    )
    expect(selectCoreTransactionsHistory(state)).not.toHaveLength(0)
    expect(selectCoreHistoryStart(state)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(selectCoreDebtors(state)).toEqual(getDebtors(state))
    expect(selectCoreBalancesByDate(state)).toEqual(getBalancesByDate(state))
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
