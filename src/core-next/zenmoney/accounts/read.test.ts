import { describe, expect, it } from 'vitest'
import { makeAccount, makeStore } from '../../testing/zenmoneyTestData'
import {
  getAccountList,
  getAccounts,
  getAccStartBalance,
  getDebtAccountId,
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
})
