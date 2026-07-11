import { describe, expect, it } from 'vitest'
import { DataEntity } from '6-shared/types'
import {
  makeAccount,
  makeReminder,
  makeStore,
  makeTransaction,
  makeUser,
} from '../../testing/zenmoneyTestData'
import { applyPatch } from '../applyPatch'
import {
  compileCreateAccount,
  compileDeleteAccount,
  compileMergeAccounts,
  compilePatchAccount,
} from './commands'
import { makeAccount as makeCoreAccount } from './factory'
import { AccountType } from './types'

describe('zenmoney account commands', () => {
  it('creates accounts with root user and deterministic id/time', () => {
    const data = makeStore({
      user: {
        2: { id: 2, parent: 1 },
        1: { id: 1, parent: null },
      } as any,
    })

    const patch = compileCreateAccount(
      data,
      {
        instrument: 2,
        title: 'Savings',
        type: AccountType.Deposit,
        balance: 25,
        inBalance: true,
        startDate: '2026-02',
      },
      {
        now: () => 1700000000000,
        uuid: () => 'acc-new',
      }
    )

    expect(patch.account?.[0]).toEqual(
      makeCoreAccount(
        {
          id: 'acc-new',
          changed: 1700000000000,
          user: 1,
          instrument: 2,
          title: 'Savings',
          type: AccountType.Deposit,
          balance: 25,
          inBalance: true,
          startDate: '2026-02',
        },
        {
          now: () => 0,
          uuid: () => 'unused',
        }
      )
    )
  })

  it('creates production account defaults through the account factory', () => {
    expect(
      makeCoreAccount(
        {
          user: 1,
          instrument: 2,
          title: 'Cash',
        },
        {
          now: () => 1700000000000,
          uuid: () => 'acc-new',
        }
      )
    ).toEqual(
      makeAccount({
        id: 'acc-new',
        changed: 1700000000000,
        user: 1,
        instrument: 2,
        title: 'Cash',
      })
    )
  })

  it('compiles account patches using current data and deterministic time', () => {
    const data = makeStore({
      account: {
        cash: makeAccount({
          id: 'cash',
          title: 'Cash',
          balance: 100,
          inBalance: false,
          changed: 1,
        }),
      },
    })

    const patch = compilePatchAccount(
      data,
      { id: 'cash', title: 'Wallet', inBalance: true },
      { now: () => 1700000000000 }
    )

    expect(patch).toEqual({
      account: [
        makeAccount({
          id: 'cash',
          title: 'Wallet',
          balance: 100,
          inBalance: true,
          changed: 1700000000000,
        }),
      ],
    })
  })

  it('applies the compiled patch without mutating the input store', () => {
    const data = makeStore({
      account: {
        cash: makeAccount({
          id: 'cash',
          title: 'Cash',
          balance: 100,
          inBalance: false,
          changed: 1,
        }),
      },
    })

    const patch = compilePatchAccount(
      data,
      { id: 'cash', title: 'Wallet' },
      { now: () => 1700000000000 }
    )
    const next = applyPatch(data, patch)

    expect(data.account.cash.title).toBe('Cash')
    expect(next.account.cash.title).toBe('Wallet')
    expect(next.account.cash.changed).toBe(1700000000000)
  })

  it('patches every account with a fresh timestamp from the context', () => {
    const data = makeStore({
      account: {
        cash: makeAccount({ id: 'cash', title: 'Cash', changed: 1 }),
        card: makeAccount({ id: 'card', title: 'Card', changed: 2 }),
      },
    })
    const timestamps = [10, 20]

    const patch = compilePatchAccount(
      data,
      [
        { id: 'cash', title: 'Wallet' },
        { id: 'card', title: 'Credit Card' },
      ],
      { now: () => timestamps.shift() ?? 0 }
    )

    expect(patch.account?.map(acc => [acc.id, acc.changed])).toEqual([
      ['cash', 10],
      ['card', 20],
    ])
  })

  it('validates account id and existence', () => {
    const data = makeStore({
      account: {
        cash: makeAccount({ id: 'cash', title: 'Cash', changed: 1 }),
      },
    })
    const ctx = { now: () => 1 }

    expect(() =>
      compilePatchAccount(data, { title: 'No id' } as any, ctx)
    ).toThrow('Trying to patch account without id')
    expect(() =>
      compilePatchAccount(data, { id: 'missing', title: 'Missing' }, ctx)
    ).toThrow('Account not found')
  })

  it('deletes accounts through normalized deletion patches', () => {
    const data = makeStore({
      user: {
        1: { id: 1, parent: null },
      } as any,
      account: {
        cash: makeAccount({ id: 'cash', title: 'Cash', changed: 1 }),
      },
    })

    const patch = compileDeleteAccount(data, 'cash', {
      now: () => 1700000000000,
    })
    const next = applyPatch(data, patch)

    expect(patch).toEqual({
      deletion: [
        {
          id: 'cash',
          object: DataEntity.Account,
          stamp: 1700000000000,
          user: 1,
        },
      ],
    })
    expect(next.account.cash).toBeUndefined()
    expect(data.account.cash.title).toBe('Cash')
  })

  it('merges a source account into a target, reassigning and collapsing', () => {
    const data = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
      account: {
        source: makeAccount({
          id: 'source',
          title: 'Old',
          instrument: 1,
          startBalance: 30,
          balance: 200,
          changed: 1,
        }),
        target: makeAccount({
          id: 'target',
          title: 'Keep',
          instrument: 1,
          startBalance: 100,
          balance: 500,
          changed: 1,
        }),
        other: makeAccount({ id: 'other', instrument: 1, changed: 1 }),
      },
      transaction: {
        // Plain outcome on the source -> reassigned to the target.
        spend: makeTransaction({
          id: 'spend',
          income: 0,
          outcome: 10,
          outcomeAccount: 'source',
          changed: 1,
        }),
        // Transfer source -> other -> only the source side is rewritten.
        transferOut: makeTransaction({
          id: 'transferOut',
          income: 5,
          incomeAccount: 'other',
          outcome: 5,
          outcomeAccount: 'source',
          changed: 1,
        }),
        // Transfer between merged accounts -> deleted, folded into start.
        internal: makeTransaction({
          id: 'internal',
          income: 40,
          incomeAccount: 'target',
          outcome: 25,
          outcomeAccount: 'source',
          changed: 1,
        }),
        // Untouched transaction on unrelated accounts.
        unrelated: makeTransaction({
          id: 'unrelated',
          income: 0,
          outcome: 7,
          outcomeAccount: 'other',
          changed: 1,
        }),
      },
      reminder: {
        sourceReminder: makeReminder({
          id: 'sourceReminder',
          incomeAccount: 'source',
          outcomeAccount: 'other',
          changed: 1,
        }),
        unrelatedReminder: makeReminder({
          id: 'unrelatedReminder',
          incomeAccount: 'target',
          outcomeAccount: 'other',
          changed: 1,
        }),
      },
    })

    const patch = compileMergeAccounts(data, 'source', 'target', {
      now: () => 100,
    })
    const next = applyPatch(data, patch)

    // Plain source transaction moved onto the target.
    expect(next.transaction.spend).toMatchObject({
      outcomeAccount: 'target',
      changed: 100,
    })
    // Source side of a transfer with a third account rewritten to the target.
    expect(next.transaction.transferOut).toMatchObject({
      incomeAccount: 'other',
      outcomeAccount: 'target',
      changed: 100,
    })
    // Transfer between the merged accounts collapses.
    expect(next.transaction.internal.deleted).toBe(true)
    // Unrelated transaction untouched (absent from the patch).
    expect(patch.transaction?.map(tr => tr.id)).not.toContain('unrelated')
    expect(next.reminder.sourceReminder).toMatchObject({
      incomeAccount: 'target',
      outcomeAccount: 'other',
      changed: 100,
    })
    expect(patch.reminder?.map(reminder => reminder.id)).not.toContain(
      'unrelatedReminder'
    )

    // Start balance absorbs the source start (30) plus the internal transfer's
    // net movement (income 40 - outcome 25 = +15): 100 + 30 + 15 = 145.
    expect(next.account.target).toMatchObject({
      startBalance: 145,
      balance: 700,
      changed: 100,
    })
    // Source account removed.
    expect(next.account.source).toBeUndefined()
  })

  it('rejects merging accounts with different currencies', () => {
    const data = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
      account: {
        source: makeAccount({ id: 'source', instrument: 1, changed: 1 }),
        target: makeAccount({ id: 'target', instrument: 2, changed: 1 }),
      },
    })

    expect(() =>
      compileMergeAccounts(data, 'source', 'target', { now: () => 1 })
    ).toThrow('Currency should be the same')
    expect(() =>
      compileMergeAccounts(data, 'missing', 'target', { now: () => 1 })
    ).toThrow('Account not found')
    expect(() =>
      compileMergeAccounts(data, 'target', 'target', { now: () => 1 })
    ).toThrow('Accounts should be different')
  })

  it('validates account create and delete commands', () => {
    expect(() =>
      compileCreateAccount(
        makeStore(),
        { instrument: 1, title: 'No user' },
        { now: () => 1, uuid: () => 'account' }
      )
    ).toThrow('No user')

    expect(() =>
      compileDeleteAccount(makeStore(), 'missing', { now: () => 1 })
    ).toThrow('Account not found')

    expect(() =>
      compileDeleteAccount(
        makeStore({
          account: {
            cash: makeAccount({ id: 'cash', title: 'Cash', changed: 1 }),
          },
        }),
        'cash',
        { now: () => 1 }
      )
    ).toThrow('No user')
  })
})
