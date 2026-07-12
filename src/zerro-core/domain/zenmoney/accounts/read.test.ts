import { describe, expect, it } from 'vitest'
import { makeAccount, makeStore } from '../../../testing/zenmoneyTestData'
import {
  getAccountList,
  getAccounts,
  getAccStartBalance,
  getDebtAccountId,
  getPopulatedAccounts,
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

  it('normalizes start balance for loan and deposit account facts', () => {
    expect(
      getAccStartBalance(
        makeAccount({
          id: 'cash',
          type: AccountType.Cash,
          startBalance: 100,
        })
      )
    ).toBe(100)
    expect(
      getAccStartBalance(
        makeAccount({
          id: 'deposit',
          type: AccountType.Deposit,
          startBalance: 100,
        })
      )
    ).toBe(0)
    expect(
      getAccStartBalance(
        makeAccount({
          id: 'loan',
          type: AccountType.Loan,
          startBalance: 100,
        })
      )
    ).toBe(0)
  })

  it('builds the account projection used by Redux consumers', () => {
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
    expect(
      isInBudgetAccount(
        makeAccount({ id: 'pinned', title: 'Pinned 📍', inBalance: false })
      )
    ).toBe(true)
  })
})
