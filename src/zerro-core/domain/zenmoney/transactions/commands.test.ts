import { describe, expect, it } from 'vitest'
import {
  makeAccount,
  makeStore,
  makeTransaction,
} from '../../../testing/zenmoneyTestData'
import { applyPatch } from '../applyPatch'
import {
  compileBulkEditTransactions,
  compileCombineToIncome,
  compileCombineToOutcome,
  compileDeleteTransactions,
  compileDeleteTransactionsPermanently,
  compileMergeTransactionsAsTransfer,
  compileRestoreTransaction,
} from './commands'
import { makeTransaction as makeCoreTransaction } from './factory'

describe('zenmoney transaction commands', () => {
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

  it('preserves explicit writable falsy values in the transaction factory', () => {
    expect(
      makeCoreTransaction(
        {
          user: 1,
          date: '2026-02',
          incomeInstrument: 1,
          incomeAccount: 'cash',
          outcomeInstrument: 1,
          outcomeAccount: 'card',
          hold: null,
          comment: '',
          latitude: 0,
          longitude: 0,
          opIncome: null,
          opOutcome: null,
        },
        { now: () => 100, uuid: () => 'tr-new' }
      )
    ).toMatchObject({
      hold: null,
      comment: '',
      latitude: 0,
      longitude: 0,
      opIncome: null,
      opOutcome: null,
    })
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

    const patch = compileDeleteTransactions(data, 'tr')
    const next = applyPatch(data, patch)

    expect(patch.transaction?.[0]).toMatchObject({
      id: 'tr',
      deleted: true,
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

    const patch = compileDeleteTransactionsPermanently(data, 'tr')

    expect(patch.transaction?.[0]).toMatchObject({
      id: 'tr',
      income: 0.00001,
      outcome: 0.00001,
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
    })
    expect(patch.transaction?.[0]).not.toHaveProperty('changed')
    expect(patch.account).toBeUndefined()
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

    const patch = compileBulkEditTransactions(data, ['tr'], {
      tags: ['mixed', 'work', 'null', 'food'],
      comment: 'Team $&',
    })

    expect(patch.transaction?.[0]).toMatchObject({
      id: 'tr',
      tag: ['food', 'cash', 'work'],
      comment: 'Team Lunch',
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

    const patch = compileCombineToOutcome(data, ['out', 'inSame', 'inOther'])
    const byId = Object.fromEntries(
      (patch.transaction ?? []).map(tr => [tr.id, tr])
    )

    // Same-account income is deleted.
    expect(byId.inSame).toMatchObject({ deleted: true })
    // Cross-account income becomes a transfer into the outcome account.
    expect(byId.inOther).toMatchObject({
      outcomeAccount: 'card',
      outcome: 20,
      outcomeInstrument: 1,
    })
    // Outcome absorbs both incomes: 100 - 30 - 20 = 50.
    expect(byId.out).toMatchObject({ outcome: 50 })
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

    const patch = compileCombineToIncome(data, ['in', 'outSame', 'outOther'])
    const byId = Object.fromEntries(
      (patch.transaction ?? []).map(tr => [tr.id, tr])
    )

    expect(byId.outSame).toMatchObject({ deleted: true })
    expect(byId.outOther).toMatchObject({
      incomeAccount: 'card',
      income: 20,
      incomeInstrument: 1,
    })
    expect(byId.in).toMatchObject({ income: 50 })
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

    const patch = compileMergeTransactionsAsTransfer(data, ['out', 'in'])
    const byId = Object.fromEntries(
      (patch.transaction ?? []).map(tr => [tr.id, tr])
    )

    expect(byId.out).toMatchObject({ deleted: true })
    expect(byId.in).toMatchObject({
      outcome: 100,
      outcomeAccount: 'cash',
      outcomeInstrument: 1,
    })
  })

  it('rejects a transfer merge without one income and one outcome', () => {
    const data = makeStore({
      transaction: {
        out: makeTransaction({ id: 'out', income: 0, outcome: 100 }),
      },
    })

    expect(() => compileMergeTransactionsAsTransfer(data, ['out'])).toThrow(
      'Transfer merge needs exactly one income and one outcome'
    )
  })

  it('validates transaction existence', () => {
    expect(() => compileDeleteTransactions(makeStore(), 'missing')).toThrow(
      'Transaction not found'
    )
  })
})
