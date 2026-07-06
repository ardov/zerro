import { describe, expect, it } from 'vitest'
import { makeAccount, makeInstrument, makeStore } from '../../testing/zenmoneyTestData'
import {
  getAccount,
  getAccountList,
  getAccounts,
  getBalanceAccounts,
  getDebtAccountId,
  getInBudgetAccounts,
  getSavingAccounts,
  isInBudgetAccount,
} from './read'
import { AccountType } from './types'

describe('zenmoney account reads', () => {
  it('reads accounts by map, id, and list', () => {
    const cash = makeAccount({ id: 'cash', title: 'Cash' })
    const card = makeAccount({ id: 'card', title: 'Card' })
    const data = makeStore({
      account: {
        cash,
        card,
      },
    })

    expect(getAccounts(data)).toBe(data.account)
    expect(getAccount(data, 'cash')).toBe(cash)
    expect(getAccount(data, 'missing')).toBeNull()
    expect(getAccountList(data)).toEqual([cash, card])
  })

  it('finds the debt account id', () => {
    const data = makeStore({
      account: {
        cash: makeAccount({ id: 'cash', type: AccountType.Cash }),
        debt: makeAccount({ id: 'debt', type: AccountType.Debt }),
      },
    })

    expect(getDebtAccountId(data)).toBe('debt')
    expect(getDebtAccountId(makeStore())).toBeUndefined()
  })

  it('classifies budget and saving accounts like the legacy account selectors', () => {
    const data = makeStore({
      account: {
        cash: makeAccount({
          id: 'cash',
          title: 'Cash',
          inBalance: true,
          balance: 100,
        }),
        pinned: makeAccount({
          id: 'pinned',
          title: 'Wallet 📍',
          inBalance: false,
          balance: 50,
        }),
        safe: makeAccount({
          id: 'safe',
          title: 'Safe',
          inBalance: false,
        }),
        debt: makeAccount({
          id: 'debt',
          title: 'Debt',
          type: AccountType.Debt,
          inBalance: true,
        }),
        data: makeAccount({
          id: 'data',
          title: '🤖 [Zerro Data]',
          inBalance: false,
        }),
      },
      instrument: {
        1: makeInstrument({ id: 1, shortTitle: 'USD' }),
      },
    })

    expect(isInBudgetAccount(data.account.cash)).toBe(true)
    expect(isInBudgetAccount(data.account.pinned)).toBe(true)
    expect(isInBudgetAccount(data.account.debt)).toBe(false)
    expect(getInBudgetAccounts(data)).toEqual([
      { id: 'cash', balance: 100, fxCode: 'USD' },
      { id: 'pinned', balance: 50, fxCode: 'USD' },
    ])
    expect(getSavingAccounts(data).map(account => account.id)).toEqual(['safe'])
  })

  it('prepares balance accounts with fx codes', () => {
    const data = makeStore({
      account: {
        usd: makeAccount({
          id: 'usd',
          type: AccountType.Cash,
          instrument: 1,
          balance: 10,
        }),
        eur: makeAccount({
          id: 'eur',
          type: AccountType.Ccard,
          instrument: 2,
          balance: -20,
        }),
      },
      instrument: {
        1: makeInstrument({ id: 1, shortTitle: 'USD' }),
        2: makeInstrument({ id: 2, shortTitle: 'EUR' }),
      },
    })

    expect(getBalanceAccounts(data)).toEqual({
      usd: { id: 'usd', type: AccountType.Cash, fxCode: 'USD', balance: 10 },
      eur: { id: 'eur', type: AccountType.Ccard, fxCode: 'EUR', balance: -20 },
    })
  })
})
