import { describe, expect, it } from 'vitest'
import {
  makeAccount,
  makeStore,
} from '../../../../support/testing/zenmoneyTestData'
import { compilePatchAccount } from './accounts'
import { makeAccount as makeCoreAccount } from './accounts'

describe('zenmoney account commands', () => {
  it('creates production account defaults through the account factory', () => {
    expect(
      makeCoreAccount(
        {
          user: 1,
          instrument: 2,
          title: 'Cash',
          startDate: '2026-02',
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
        balanceCorrectionType: 'disabled',
        startDate: '2026-02-01',
      })
    )
  })

  it.each([
    { enableCorrection: false, expected: 'disabled' },
    { enableCorrection: true, expected: 'request' },
  ])(
    'creates a valid correction mode with correction enabled=$enableCorrection',
    ({ enableCorrection, expected }) => {
      const account = makeCoreAccount(
        { user: 1, title: 'Cash', instrument: 2, enableCorrection },
        { now: () => 100, uuid: () => 'new' }
      )
      expect(account.balanceCorrectionType).toBe(expected)
    }
  )

  it.each([null, 'createCorrection', 'future-mode'])(
    'preserves an explicit correction mode %s',
    balanceCorrectionType => {
      const account = makeCoreAccount(
        { user: 1, instrument: 2, title: 'Cash', balanceCorrectionType },
        { now: () => 100, uuid: () => 'new' }
      )
      expect(account.balanceCorrectionType).toBe(balanceCorrectionType)
    }
  )

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

    const patch = compilePatchAccount(data.account, {
      id: 'cash',
      title: 'Wallet',
      inBalance: true,
    })

    expect(patch).toEqual({
      account: [{ id: 'cash', title: 'Wallet', inBalance: true }],
    })
  })

  it('keeps every account patch sparse', () => {
    const data = makeStore({
      account: {
        cash: makeAccount({ id: 'cash', title: 'Cash', changed: 1 }),
        card: makeAccount({ id: 'card', title: 'Card', changed: 2 }),
      },
    })
    const patch = compilePatchAccount(data.account, [
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
    expect(() =>
      compilePatchAccount(data.account, { title: 'No id' } as any)
    ).toThrow('Trying to patch account without id')
    expect(() =>
      compilePatchAccount(data.account, { id: 'missing', title: 'Missing' })
    ).toThrow('Account not found')
  })
})
