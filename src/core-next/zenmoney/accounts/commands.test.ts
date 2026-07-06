import { describe, expect, it } from 'vitest'
import { DataEntity } from '6-shared/types'
import { makeAccount, makeStore } from '../../testing/zenmoneyTestData'
import { applyPatch } from '../applyPatch'
import {
  compileCreateAccount,
  compileDeleteAccount,
  compilePatchAccount,
} from './commands'
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
        user: 999,
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
      makeAccount({
        id: 'acc-new',
        changed: 1700000000000,
        user: 1,
        instrument: 2,
        title: 'Savings',
        type: AccountType.Deposit,
        balance: 25,
        inBalance: true,
        startDate: '2026-02-01',
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
