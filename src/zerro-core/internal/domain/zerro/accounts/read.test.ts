import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeStore,
} from '../../../../support/testing/zenmoneyTestData'
import { AccountType } from '../../zenmoney'
import {
  getZerroDataAccountId,
  getZerroInBudgetAccountIds,
  getPopulatedAccounts,
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

  it('builds Zerro account projection used by Redux consumers', () => {
    const cash = makeAccount({
      id: 'cash',
      instrument: 1,
      inBalance: true,
      startBalance: 100,
    })
    const debt = makeAccount({
      id: 'debt',
      instrument: 2,
      type: AccountType.Debt,
      inBalance: true,
    })
    const data = makeStore({ account: { cash, debt } })

    expect(getPopulatedAccounts(data, { 1: 'RUB', 2: 'USD' })).toEqual({
      cash: { ...cash, startBalanceReal: 100, inBudget: true, fxCode: 'RUB' },
      debt: { ...debt, startBalanceReal: 0, inBudget: false, fxCode: 'USD' },
    })
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
