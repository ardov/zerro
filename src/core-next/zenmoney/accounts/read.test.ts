import { describe, expect, it } from 'vitest'
import {
  makeAccount,
  makeInstrument,
  makeStore,
} from '../../testing/zenmoneyTestData'
import {
  getAccountList,
  getAccounts,
  getDebtAccountId,
  getInBudgetAccountIds,
  getSavingAccounts,
  isAccInBudget,
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

    expect(isAccInBudget(data.account.cash)).toBe(true)
    expect(isAccInBudget(data.account.pinned)).toBe(true)
    expect(isAccInBudget(data.account.debt)).toBe(false)
    expect(getInBudgetAccountIds(data)).toEqual(['cash', 'pinned'])
    expect(getSavingAccounts(data).map(account => account.id)).toEqual(['safe'])
  })
})
