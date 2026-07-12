import { describe, expect, it } from 'vitest'

import { makeAccount, makeStore } from '../../../testing/zenmoneyTestData'
import { AccountType } from '../../zenmoney'
import {
  getZerroDataAccountId,
  getZerroInBudgetAccountIds,
  getZerroSavingAccounts,
  isZerroInBudgetAccount,
} from './read'

describe('zerro account reads', () => {
  it('finds the Zerro data account by storage-convention title', () => {
    const data = makeStore({
      account: {
        cash: makeAccount({ id: 'cash', title: 'Cash' }),
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
    })

    expect(getZerroDataAccountId(data)).toBe('data')
    expect(getZerroDataAccountId(makeStore())).toBeUndefined()
  })

  it('classifies Zerro in-budget accounts with pin-title convention', () => {
    const data = makeStore({
      account: {
        cash: makeAccount({
          id: 'cash',
          title: 'Cash',
          inBalance: true,
        }),
        pinned: makeAccount({
          id: 'pinned',
          title: 'Wallet 📍',
          inBalance: false,
        }),
        debt: makeAccount({
          id: 'debt',
          title: 'Debt',
          type: AccountType.Debt,
          inBalance: true,
        }),
      },
    })

    expect(isZerroInBudgetAccount(data.account.cash)).toBe(true)
    expect(isZerroInBudgetAccount(data.account.pinned)).toBe(true)
    expect(isZerroInBudgetAccount(data.account.debt)).toBe(false)
    expect(getZerroInBudgetAccountIds(data)).toEqual(['cash', 'pinned'])
  })

  it('keeps saving account projection free of debt and data accounts', () => {
    const data = makeStore({
      account: {
        safe: makeAccount({
          id: 'safe',
          title: 'Safe',
          inBalance: false,
        }),
        pinned: makeAccount({
          id: 'pinned',
          title: 'Wallet 📍',
          inBalance: false,
        }),
        debt: makeAccount({
          id: 'debt',
          title: 'Debt',
          type: AccountType.Debt,
          inBalance: false,
        }),
        data: makeAccount({
          id: 'data',
          title: '🤖 [Zerro Data]',
          inBalance: false,
        }),
      },
    })

    expect(getZerroSavingAccounts(data).map(account => account.id)).toEqual([
      'safe',
    ])
  })
})
