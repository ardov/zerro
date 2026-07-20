import { describe, expect, it } from 'vitest'
import {
  makeAccount,
  makeStore,
} from '../../../../support/testing/zenmoneyTestData'
import {
  getAccountList,
  getAccStartBalance,
  getDebtAccountId,
} from './accounts'
import { AccountType } from './accounts'

describe('zenmoney account reads', () => {
  it('reads accounts as a list', () => {
    const cash = makeAccount({ id: 'cash', title: 'Cash' })
    const card = makeAccount({ id: 'card', title: 'Card' })
    const data = makeStore({
      account: {
        cash,
        card,
      },
    })

    expect(getAccountList(data.account)).toEqual([cash, card])
  })

  it('finds the debt account id', () => {
    const data = makeStore({
      account: {
        cash: makeAccount({ id: 'cash', type: AccountType.Cash }),
        debt: makeAccount({ id: 'debt', type: AccountType.Debt }),
      },
    })

    expect(getDebtAccountId(data.account)).toBe('debt')
    expect(getDebtAccountId(makeStore().account)).toBeUndefined()
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
