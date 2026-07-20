import { describe, expect, it } from 'vitest'
import { makeTransaction } from '../../../../support/testing/zenmoneyTestData'
import { EnvType, envId } from '../envelope-id'
import type { TEnvelopeDebtor } from '../envelopes'
import {
  routeTransactionToActivity,
  type TTransactionActivityRoutingContext,
} from './transactionRouting'

function makeContext(
  patch: Partial<TTransactionActivityRoutingContext> = {}
): TTransactionActivityRoutingContext {
  return {
    inBudgetAccountIds: new Set(['card']),
    debtAccountId: undefined,
    debtors: {},
    ...patch,
  }
}

describe('routeTransactionToActivity', () => {
  it('routes regular transactions through tag envelopes', () => {
    const context = makeContext()

    expect(
      routeTransactionToActivity(
        makeTransaction({
          date: '2026-03-10',
          outcome: 20,
          outcomeAccount: 'card',
          tag: ['food'],
        }),
        context
      )
    ).toEqual({
      month: '2026-03',
      direction: 'outcome',
      envelopeId: envId.get(EnvType.Tag, 'food'),
    })

    expect(
      routeTransactionToActivity(
        makeTransaction({ income: 100, incomeAccount: 'card', tag: null }),
        context
      )
    ).toEqual({
      month: '2026-01',
      direction: 'income',
      envelopeId: envId.get(EnvType.Tag, 'null'),
    })
  })

  it('distinguishes internal fees from transfers crossing the budget boundary', () => {
    const context = makeContext({
      inBudgetAccountIds: new Set(['card', 'cash']),
    })

    expect(
      routeTransactionToActivity(
        makeTransaction({
          income: 10,
          outcome: 10,
          incomeAccount: 'cash',
          outcomeAccount: 'card',
        }),
        context
      )
    ).toBeNull()

    expect(
      routeTransactionToActivity(
        makeTransaction({
          income: 9,
          outcome: 10,
          incomeAccount: 'cash',
          outcomeAccount: 'card',
        }),
        context
      )
    ).toEqual({ month: '2026-01', direction: 'internal' })

    expect(
      routeTransactionToActivity(
        makeTransaction({
          income: 10,
          outcome: 10,
          incomeAccount: 'safe',
          outcomeAccount: 'card',
        }),
        context
      )
    ).toEqual({
      month: '2026-01',
      direction: 'outcome',
      envelopeId: envId.get(EnvType.Account, 'safe'),
    })

    expect(
      routeTransactionToActivity(
        makeTransaction({
          income: 10,
          outcome: 10,
          incomeAccount: 'card',
          outcomeAccount: 'safe',
        }),
        context
      )
    ).toEqual({
      month: '2026-01',
      direction: 'income',
      envelopeId: envId.get(EnvType.Account, 'safe'),
    })
  })

  it('routes debt transactions through the same debtor identity as activity', () => {
    const debtor: TEnvelopeDebtor = {
      id: 'alex',
      name: 'Alex!',
      payeeNames: ['Alex!'],
      transactions: [],
      balance: {},
    }
    const context = makeContext({
      debtAccountId: 'debt',
      debtors: { alex: debtor },
    })

    expect(
      routeTransactionToActivity(
        makeTransaction({
          income: 50,
          incomeAccount: 'debt',
          outcome: 50,
          outcomeAccount: 'card',
          payee: 'Alex!',
        }),
        context
      )
    ).toEqual({
      month: '2026-01',
      direction: 'outcome',
      envelopeId: envId.get(EnvType.Payee, 'alex'),
    })

    expect(
      routeTransactionToActivity(
        makeTransaction({
          income: 50,
          incomeAccount: 'debt',
          outcome: 50,
          outcomeAccount: 'card',
          merchant: 'merchant',
        }),
        context
      )
    ).toEqual({
      month: '2026-01',
      direction: 'outcome',
      envelopeId: envId.get(EnvType.Merchant, 'merchant'),
    })
  })

  it('ignores transactions outside budget accounts', () => {
    expect(
      routeTransactionToActivity(
        makeTransaction({
          income: 10,
          outcome: 10,
          incomeAccount: 'safe',
          outcomeAccount: 'wallet',
        }),
        makeContext()
      )
    ).toBeNull()
  })
})
