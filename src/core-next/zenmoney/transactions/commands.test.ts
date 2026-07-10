import { describe, expect, it } from 'vitest'
import {
  makeAccount,
  makeStore,
  makeTransaction,
} from '../../testing/zenmoneyTestData'
import { applyPatch } from '../applyPatch'
import {
  compileCreateTransaction,
  compileApplyChangesToTransaction,
  compileBulkEditTransactions,
  compileCombineToIncome,
  compileCombineToOutcome,
  compileDeleteTransactions,
  compileDeleteTransactionsPermanently,
  compileMarkTransactionsViewed,
  compileMergeTransactionsAsTransfer,
  compileRecreateTransaction,
  compileRestoreTransaction,
} from './commands'
import { makeTransaction as makeCoreTransaction } from './factory'

describe('zenmoney transaction commands', () => {
  it('creates transaction intent without materialized balance effects', () => {
    const data = makeStore({
      user: {
        1: { id: 1, parent: null },
      } as any,
      account: {
        cash: makeAccount({ id: 'cash', balance: 100 }),
        card: makeAccount({ id: 'card', balance: 50 }),
      },
    })

    const result = compileCreateTransaction(
      data,
      {
        date: '2026-02',
        income: 25,
        incomeInstrument: 1,
        incomeAccount: 'cash',
        outcome: 10,
        outcomeInstrument: 1,
        outcomeAccount: 'card',
        comment: 'Transfer',
      },
      {
        now: () => 1700000000000,
        uuid: () => 'tr-new',
      }
    )
    const next = applyPatch(data, result.patch)

    expect(result.receipt.transactionId).toBe('tr-new')
    expect(result.patch.transaction?.[0]).toEqual(
      makeTransaction({
        id: 'tr-new',
        changed: 1700000000000,
        created: 1700000000000,
        user: 1,
        date: '2026-02-01',
        income: 25,
        incomeInstrument: 1,
        incomeAccount: 'cash',
        outcome: 10,
        outcomeInstrument: 1,
        outcomeAccount: 'card',
        comment: 'Transfer',
        hold: false,
      })
    )
    expect(result.patch.account).toBeUndefined()
    expect(next.transaction['tr-new'].comment).toBe('Transfer')
    expect(next.account.cash.balance).toBe(100)
    expect(next.account.card.balance).toBe(50)
  })

  it('creates production transaction defaults through the transaction factory', () => {
    expect(
      makeCoreTransaction(
        {
          user: 1,
          date: '2026-02',
          incomeInstrument: 1,
          incomeAccount: 'cash',
          outcomeInstrument: 1,
          outcomeAccount: 'card',
        },
        {
          now: () => 1700000000000,
          uuid: () => 'tr-new',
        }
      )
    ).toEqual(
      makeTransaction({
        id: 'tr-new',
        changed: 1700000000000,
        created: 1700000000000,
        user: 1,
        date: '2026-02-01',
        incomeInstrument: 1,
        incomeAccount: 'cash',
        outcomeInstrument: 1,
        outcomeAccount: 'card',
        hold: false,
        opIncome: 0,
        opOutcome: 0,
      })
    )
  })

  it('soft-deletes transactions', () => {
    const data = makeStore({
      account: {
        card: makeAccount({ id: 'card', balance: 50 }),
      },
      transaction: {
        tr: makeTransaction({
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
    expect(patch.account).toBeUndefined()
    expect(next.account.card.balance).toBe(50)
    expect(data.transaction.tr.deleted).toBe(false)
  })

  it('permanently deletes transactions by zeroing visible amounts', () => {
    const data = makeStore({
      account: {
        cash: makeAccount({ id: 'cash', balance: 100 }),
        card: makeAccount({ id: 'card', balance: 50 }),
      },
      transaction: {
        tr: makeTransaction({ id: 'tr', income: 50, outcome: 10, changed: 1 }),
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
    expect(patch.account).toBeUndefined()
  })

  it('marks only transactions whose viewed state changes', () => {
    const data = makeStore({
      transaction: {
        fresh: makeTransaction({ id: 'fresh', viewed: false, changed: 1 }),
        alreadyViewed: makeTransaction({
          id: 'alreadyViewed',
          viewed: true,
          changed: 1,
        }),
        deleted: makeTransaction({ id: 'deleted', deleted: true, changed: 1 }),
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
        cash: makeAccount({ id: 'cash', balance: 100 }),
        card: makeAccount({ id: 'card', balance: 50 }),
      },
      transaction: {
        tr: makeTransaction({
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
    expect(patch.account).toBeUndefined()
  })

  it('restores transactions under a new id', () => {
    const data = makeStore({
      account: {
        card: makeAccount({ id: 'card', balance: 50 }),
      },
      transaction: {
        tr: makeTransaction({
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
    expect(patch.account).toBeUndefined()
  })

  it('recreates a transaction and returns the new id', () => {
    const data = makeStore({
      account: {
        cash: makeAccount({ id: 'cash', balance: 100 }),
        card: makeAccount({ id: 'card', balance: 50 }),
      },
      transaction: {
        tr: makeTransaction({ id: 'tr', income: 50, outcome: 0, changed: 1 }),
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

    expect(result.receipt.transactionId).toBe('new-tr')
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
    expect(result.patch.account).toBeUndefined()
  })

  it('bulk-edits tags and comments with legacy placeholders', () => {
    const data = makeStore({
      transaction: {
        tr: makeTransaction({
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

  it('combines incomes into the outcome, deleting or transferring each', () => {
    const data = makeStore({
      transaction: {
        out: makeTransaction({
          id: 'out',
          income: 0,
          outcome: 100,
          outcomeInstrument: 1,
          outcomeAccount: 'card',
        }),
        inSame: makeTransaction({
          id: 'inSame',
          income: 30,
          incomeInstrument: 1,
          incomeAccount: 'card',
          outcome: 0,
        }),
        inOther: makeTransaction({
          id: 'inOther',
          income: 20,
          incomeInstrument: 1,
          incomeAccount: 'cash',
          outcome: 0,
        }),
      },
    })

    const patch = compileCombineToOutcome(data, ['out', 'inSame', 'inOther'], {
      now: () => 100,
    })
    const byId = Object.fromEntries(
      (patch.transaction ?? []).map(tr => [tr.id, tr])
    )

    // Same-account income is deleted.
    expect(byId.inSame).toMatchObject({ deleted: true, changed: 100 })
    // Cross-account income becomes a transfer into the outcome account.
    expect(byId.inOther).toMatchObject({
      outcomeAccount: 'card',
      outcome: 20,
      outcomeInstrument: 1,
      changed: 100,
    })
    // Outcome absorbs both incomes: 100 - 30 - 20 = 50.
    expect(byId.out).toMatchObject({ outcome: 50, changed: 100 })
  })

  it('combines outcomes into the income, deleting or transferring each', () => {
    const data = makeStore({
      transaction: {
        in: makeTransaction({
          id: 'in',
          income: 100,
          incomeInstrument: 1,
          incomeAccount: 'card',
          outcome: 0,
        }),
        outSame: makeTransaction({
          id: 'outSame',
          income: 0,
          outcome: 30,
          outcomeInstrument: 1,
          outcomeAccount: 'card',
        }),
        outOther: makeTransaction({
          id: 'outOther',
          income: 0,
          outcome: 20,
          outcomeInstrument: 1,
          outcomeAccount: 'cash',
        }),
      },
    })

    const patch = compileCombineToIncome(data, ['in', 'outSame', 'outOther'], {
      now: () => 100,
    })
    const byId = Object.fromEntries(
      (patch.transaction ?? []).map(tr => [tr.id, tr])
    )

    expect(byId.outSame).toMatchObject({ deleted: true, changed: 100 })
    expect(byId.outOther).toMatchObject({
      incomeAccount: 'card',
      income: 20,
      incomeInstrument: 1,
      changed: 100,
    })
    expect(byId.in).toMatchObject({ income: 50, changed: 100 })
  })

  it('merges an income and outcome into a single transfer', () => {
    const data = makeStore({
      transaction: {
        out: makeTransaction({
          id: 'out',
          income: 0,
          outcome: 100,
          outcomeInstrument: 1,
          outcomeAccount: 'cash',
        }),
        in: makeTransaction({
          id: 'in',
          income: 100,
          incomeInstrument: 1,
          incomeAccount: 'card',
          outcome: 0,
        }),
      },
    })

    const patch = compileMergeTransactionsAsTransfer(data, ['out', 'in'], {
      now: () => 100,
    })
    const byId = Object.fromEntries(
      (patch.transaction ?? []).map(tr => [tr.id, tr])
    )

    expect(byId.out).toMatchObject({ deleted: true, changed: 100 })
    expect(byId.in).toMatchObject({
      income: 100,
      incomeAccount: 'card',
      outcome: 100,
      outcomeAccount: 'cash',
      outcomeInstrument: 1,
      changed: 100,
    })
  })

  it('rejects a transfer merge without one income and one outcome', () => {
    const data = makeStore({
      transaction: {
        out: makeTransaction({ id: 'out', income: 0, outcome: 100 }),
      },
    })

    expect(() =>
      compileMergeTransactionsAsTransfer(data, ['out'], { now: () => 100 })
    ).toThrow('Transfer merge needs exactly one income and one outcome')
  })

  it('validates transaction existence', () => {
    expect(() =>
      compileCreateTransaction(
        makeStore(),
        {
          date: '2026-01-01',
          incomeInstrument: 1,
          incomeAccount: 'cash',
          outcomeInstrument: 1,
          outcomeAccount: 'card',
        },
        {
          now: () => 1,
          uuid: () => 'tr',
        }
      )
    ).toThrow('No user')

    expect(() =>
      compileDeleteTransactions(makeStore(), 'missing', { now: () => 1 })
    ).toThrow('Transaction not found')
  })
})
