import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeStore,
  makeUser,
} from '../../testing/zenmoneyTestData'
import { applyPatch } from '../../zenmoney'
import { compileEnsureZerroDataAccount } from './commands'

describe('zerro account commands', () => {
  it('returns the existing Zerro data account id without a patch', () => {
    const data = makeStore({
      account: {
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
    })

    expect(
      compileEnsureZerroDataAccount(data, {
        now: () => 100,
        uuid: () => 'unused',
      })
    ).toEqual({
      patch: {},
      receipt: { accountId: 'data' },
    })
  })

  it('creates the Zerro data account from the root user currency', () => {
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
    })

    const result = compileEnsureZerroDataAccount(data, {
      now: () => 100,
      uuid: () => 'data-account',
    })
    const next = applyPatch(data, result.patch)

    expect(result.receipt.accountId).toBe('data-account')
    expect(result.patch.account).toEqual([
      makeAccount({
        id: 'data-account',
        changed: 100,
        title: '🤖 [Zerro Data]',
        user: 1,
        instrument: 2,
      }),
    ])
    expect(next.account['data-account'].title).toBe('🤖 [Zerro Data]')
  })

  it('requires a root user when creating the data account', () => {
    expect(() =>
      compileEnsureZerroDataAccount(makeStore(), {
        now: () => 100,
        uuid: () => 'data-account',
      })
    ).toThrow('No root user')
  })
})
