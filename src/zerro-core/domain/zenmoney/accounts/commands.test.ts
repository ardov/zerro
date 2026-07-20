import { describe, expect, it } from 'vitest'
import { DataEntity } from '6-shared/types'
import { makeAccount, makeStore } from '../../../testing/zenmoneyTestData'
import {
  issuePatch,
  materializeCommand,
} from '../../../application/materializer'
import { applyPatch } from '../applyPatch'
import {
  compileCreateAccount,
  compileDeleteAccount,
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

  it('compiles sparse patches for existing accounts', () => {
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

    const patch = compilePatchAccount(data, {
      id: 'cash',
      title: 'Wallet',
      inBalance: true,
    })

    expect(patch).toEqual({
      account: [{ id: 'cash', title: 'Wallet', inBalance: true }],
    })
  })

  it('materializes timestamps without mutating the input store', () => {
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

    const patch = compilePatchAccount(data, { id: 'cash', title: 'Wallet' })
    const command = issuePatch(data, patch, 1700000000000)
    const next = applyPatch(data, materializeCommand(data, command))

    expect(data.account.cash.title).toBe('Cash')
    expect(next.account.cash.title).toBe('Wallet')
    expect(next.account.cash.changed).toBe(1700000000000)
  })

  it('keeps every account patch sparse', () => {
    const data = makeStore({
      account: {
        cash: makeAccount({ id: 'cash', title: 'Cash', changed: 1 }),
        card: makeAccount({ id: 'card', title: 'Card', changed: 2 }),
      },
    })
    const patch = compilePatchAccount(data, [
      { id: 'cash', title: 'Wallet' },
      { id: 'card', title: 'Credit Card' },
    ])

    expect(patch.account).toEqual([
      { id: 'cash', title: 'Wallet' },
      { id: 'card', title: 'Credit Card' },
    ])
  })

  it('validates account id and existence', () => {
    const data = makeStore({
      account: {
        cash: makeAccount({ id: 'cash', title: 'Cash', changed: 1 }),
      },
    })
    expect(() => compilePatchAccount(data, { title: 'No id' } as any)).toThrow(
      'Trying to patch account without id'
    )
    expect(() =>
      compilePatchAccount(data, { id: 'missing', title: 'Missing' })
    ).toThrow('Account not found')
  })

  it('compiles sparse deletions and materializes protocol metadata', () => {
    const data = makeStore({
      user: {
        1: { id: 1, parent: null },
      } as any,
      account: {
        cash: makeAccount({ id: 'cash', title: 'Cash', changed: 1 }),
      },
    })

    const patch = compileDeleteAccount(data, 'cash')
    const command = issuePatch(data, patch, 1700000000000)
    const next = applyPatch(data, materializeCommand(data, command))

    expect(patch).toEqual({
      deletion: [{ id: 'cash', object: DataEntity.Account }],
    })
    expect(materializeCommand(data, command)).toEqual({
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

    expect(() => compileDeleteAccount(makeStore(), 'missing')).toThrow(
      'Account not found'
    )
  })
})
