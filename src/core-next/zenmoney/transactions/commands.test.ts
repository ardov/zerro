import { describe, expect, it } from 'vitest'
import type { TAccount, TDataStore, TTransaction } from '6-shared/types'
import { applyPatch } from '../applyPatch'
import {
  compileApplyChangesToTransaction,
  compileBulkEditTransactions,
  compileDeleteTransactions,
  compileDeleteTransactionsPermanently,
  compileMarkTransactionsViewed,
  compileRecreateTransaction,
  compileRestoreTransaction,
} from './commands'

describe('zenmoney transaction commands', () => {
  it('soft-deletes transactions', () => {
    const data = makeStore({
      account: {
        card: account({ id: 'card', balance: 50 }),
      },
      transaction: {
        tr: transaction({
          id: 'tr',
          deleted: false,
          outcome: 10,
          outcomeAccount: 'card',
          changed: 1,
        }),
      },
    })

    const patch = compileDeleteTransactions(data, 'tr', {
      now: () => 100,
    })
    const next = applyPatch(data, patch)

    expect(patch.transaction?.[0]).toMatchObject({
      id: 'tr',
      deleted: true,
      changed: 100,
    })
    expect(next.transaction.tr.deleted).toBe(true)
    expect(next.account.card.balance).toBe(60)
    expect(data.transaction.tr.deleted).toBe(false)
  })

  it('permanently deletes transactions by zeroing visible amounts', () => {
    const data = makeStore({
      account: {
        cash: account({ id: 'cash', balance: 100 }),
        card: account({ id: 'card', balance: 50 }),
      },
      transaction: {
        tr: transaction({ id: 'tr', income: 50, outcome: 10, changed: 1 }),
      },
    })

    const patch = compileDeleteTransactionsPermanently(data, 'tr', {
      now: () => 100,
    })

    expect(patch.transaction?.[0]).toMatchObject({
      id: 'tr',
      income: 0.00001,
      outcome: 0.00001,
      changed: 100,
    })
    expect(patch.account).toEqual([
      account({ id: 'cash', balance: 50, changed: 100 }),
      account({ id: 'card', balance: 60, changed: 100 }),
    ])
  })

  it('marks only transactions whose viewed state changes', () => {
    const data = makeStore({
      transaction: {
        fresh: transaction({ id: 'fresh', viewed: false, changed: 1 }),
        alreadyViewed: transaction({
          id: 'alreadyViewed',
          viewed: true,
          changed: 1,
        }),
        deleted: transaction({ id: 'deleted', deleted: true, changed: 1 }),
      },
    })

    const patch = compileMarkTransactionsViewed(
      data,
      ['fresh', 'alreadyViewed', 'deleted'],
      true,
      { now: () => 100 }
    )

    expect(patch.transaction?.map(transaction => transaction.id)).toEqual([
      'fresh',
    ])
    expect(patch.transaction?.[0]).toMatchObject({
      viewed: true,
      changed: 100,
    })
  })

  it('applies transaction field changes', () => {
    const data = makeStore({
      account: {
        cash: account({ id: 'cash', balance: 100 }),
        card: account({ id: 'card', balance: 50 }),
      },
      transaction: {
        tr: transaction({
          id: 'tr',
          outcome: 10,
          outcomeAccount: 'card',
          comment: 'Old',
          changed: 1,
        }),
      },
    })

    const patch = compileApplyChangesToTransaction(
      data,
      { id: 'tr', comment: 'New', outcome: 20 },
      { now: () => 100 }
    )

    expect(patch.transaction?.[0]).toMatchObject({
      id: 'tr',
      comment: 'New',
      outcome: 20,
      changed: 100,
    })
    expect(patch.account).toEqual([
      account({ id: 'card', balance: 40, changed: 100 }),
    ])
  })

  it('restores transactions under a new id', () => {
    const data = makeStore({
      account: {
        card: account({ id: 'card', balance: 50 }),
      },
      transaction: {
        tr: transaction({
          id: 'tr',
          deleted: true,
          outcome: 10,
          outcomeAccount: 'card',
          changed: 1,
        }),
      },
    })

    const patch = compileRestoreTransaction(data, 'tr', {
      now: () => 100,
      uuid: () => 'new-tr',
    })

    expect(patch.transaction?.[0]).toMatchObject({
      id: 'new-tr',
      deleted: false,
      changed: 100,
    })
    expect(patch.account).toEqual([
      account({ id: 'card', balance: 40, changed: 100 }),
    ])
  })

  it('recreates a transaction and returns the new id', () => {
    const data = makeStore({
      account: {
        cash: account({ id: 'cash', balance: 100 }),
        card: account({ id: 'card', balance: 50 }),
      },
      transaction: {
        tr: transaction({ id: 'tr', income: 50, outcome: 0, changed: 1 }),
      },
    })
    const timestamps = [100, 200, 300, 400]

    const result = compileRecreateTransaction(
      data,
      { id: 'tr', outcome: 25, income: 0 },
      {
        now: () => timestamps.shift() ?? 0,
        uuid: () => 'new-tr',
      }
    )

    expect(result.transactionId).toBe('new-tr')
    expect(result.patch.transaction).toHaveLength(2)
    expect(result.patch.transaction?.[0]).toMatchObject({
      id: 'tr',
      income: 0.00001,
      outcome: 0.00001,
      changed: 100,
    })
    expect(result.patch.transaction?.[1]).toMatchObject({
      id: 'new-tr',
      income: 0,
      outcome: 25,
      changed: 200,
    })
    expect(result.patch.account).toEqual([
      account({ id: 'cash', balance: 50, changed: 300 }),
      account({ id: 'card', balance: 25, changed: 400 }),
    ])
  })

  it('bulk-edits tags and comments with legacy placeholders', () => {
    const data = makeStore({
      transaction: {
        tr: transaction({
          id: 'tr',
          tag: ['food', 'cash'],
          comment: 'Lunch',
          changed: 1,
        }),
      },
    })

    const patch = compileBulkEditTransactions(
      data,
      ['tr'],
      { tags: ['mixed', 'work', 'null', 'food'], comment: 'Team $&' },
      { now: () => 100 }
    )

    expect(patch.transaction?.[0]).toMatchObject({
      id: 'tr',
      tag: ['food', 'cash', 'work'],
      comment: 'Team Lunch',
      changed: 100,
    })
  })

  it('validates transaction existence', () => {
    expect(() =>
      compileDeleteTransactions(makeStore(), 'missing', { now: () => 1 })
    ).toThrow('Transaction not found')
  })
})

function makeStore(patch: Partial<TDataStore> = {}): TDataStore {
  return {
    serverTimestamp: 0,
    instrument: {},
    country: {},
    company: {},
    user: {},
    merchant: {},
    account: {},
    tag: {},
    budget: {},
    reminder: {},
    reminderMarker: {},
    transaction: {},
    ...patch,
  } as TDataStore
}

function account(value: Partial<TAccount> & { id: string }): TAccount {
  return {
    user: 1,
    instrument: 1,
    title: '',
    changed: 0,
    role: null,
    company: null,
    type: 'cash',
    syncID: null,
    balance: 0,
    startBalance: 0,
    creditLimit: 0,
    inBalance: false,
    savings: false,
    enableCorrection: false,
    enableSMS: false,
    archive: false,
    private: false,
    capitalization: null,
    percent: null,
    startDate: null,
    endDateOffset: null,
    endDateOffsetInterval: null,
    payoffStep: null,
    payoffInterval: null,
    ...value,
  } as TAccount
}

function transaction(
  patch: Partial<TTransaction> & { id: string }
): TTransaction {
  return {
    changed: 0,
    created: 0,
    user: 1,
    deleted: false,
    hold: null,
    viewed: false,
    qrCode: null,
    incomeBankID: null,
    income: 0,
    incomeInstrument: 1,
    incomeAccount: 'cash',
    outcomeBankID: null,
    outcome: 0,
    outcomeInstrument: 1,
    outcomeAccount: 'card',
    tag: null,
    merchant: null,
    payee: null,
    originalPayee: null,
    comment: null,
    date: '2026-01-01',
    mcc: null,
    reminderMarker: null,
    opIncome: 0,
    opIncomeInstrument: null,
    opOutcome: 0,
    opOutcomeInstrument: null,
    latitude: null,
    longitude: null,
    ...patch,
  } as TTransaction
}
