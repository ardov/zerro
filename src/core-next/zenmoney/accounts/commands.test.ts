import { describe, expect, it } from 'vitest'
import type { TAccount, TDataStore } from '6-shared/types'
import { applyPatch } from '../applyPatch'
import { compilePatchAccount } from './commands'

describe('zenmoney account commands', () => {
  it('compiles account patches using current data and deterministic time', () => {
    const data = makeStore({
      account: {
        cash: account({
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
        account({
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
        cash: account({
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
        cash: account({ id: 'cash', title: 'Cash', changed: 1 }),
        card: account({ id: 'card', title: 'Card', changed: 2 }),
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
        cash: account({ id: 'cash', title: 'Cash', changed: 1 }),
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
