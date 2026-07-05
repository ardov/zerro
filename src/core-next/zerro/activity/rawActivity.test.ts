import { describe, expect, it } from 'vitest'
import type { ById, TInstrument, TTransaction } from '6-shared/types'
import { EnvType, envId } from '../envelope-id'
import { buildRawActivity, EnvActivity } from './rawActivity'

describe('buildRawActivity', () => {
  it('groups income and outcome transactions by envelope', () => {
    const foodId = envId.get(EnvType.Tag, 'food')
    const result = buildRawActivity({
      transactions: [
        transaction({
          id: 'outcome',
          outcome: 20,
          outcomeAccount: 'card',
          tag: ['food'],
        }),
        transaction({
          id: 'income',
          income: 100,
          incomeAccount: 'card',
          tag: ['food'],
        }),
      ],
      inBudgetAccountIds: ['card'],
      debtAccountId: undefined,
      debtors: {},
      instruments,
    })

    expect(result['2026-01'].outcome[foodId].total).toEqual({ USD: -20 })
    expect(result['2026-01'].income[foodId].total).toEqual({ USD: 100 })
  })

  it('records internal transfer fees only when instruments or amounts differ', () => {
    const result = buildRawActivity({
      transactions: [
        transaction({
          id: 'equal-transfer',
          income: 10,
          outcome: 10,
          incomeAccount: 'cash',
          outcomeAccount: 'card',
        }),
        transaction({
          id: 'fee-transfer',
          income: 9,
          outcome: 10,
          incomeAccount: 'cash',
          outcomeAccount: 'card',
        }),
      ],
      inBudgetAccountIds: ['card', 'cash'],
      debtAccountId: undefined,
      debtors: {},
      instruments,
    })

    expect(result['2026-01'].internal.total).toEqual({ USD: -1 })
    expect(result['2026-01'].internal.transactions.map(tr => tr.id)).toEqual([
      'fee-transfer',
    ])
  })

  it('routes debt transactions through debtor envelopes', () => {
    const debtorId = envId.get(EnvType.Payee, 'alex')
    const result = buildRawActivity({
      transactions: [
        transaction({
          id: 'debt',
          income: 50,
          incomeAccount: 'debt',
          outcome: 50,
          outcomeAccount: 'card',
          payee: 'Alex!',
        }),
      ],
      inBudgetAccountIds: ['card'],
      debtAccountId: 'debt',
      debtors: {
        alex: {
          id: 'alex',
          name: 'Alex!',
          payeeNames: ['Alex!'],
          transactions: [],
          balance: {},
        },
      },
      instruments,
    })

    expect(result['2026-01'].outcome[debtorId].total).toEqual({ USD: -50 })
  })

  it('merges activity nodes', () => {
    const first = new EnvActivity()
    const second = new EnvActivity()
    first.total = { USD: 1 }
    second.total = { EUR: 2 }

    expect(EnvActivity.merge(first, second).total).toEqual({ USD: 1, EUR: 2 })
  })
})

const instruments: ById<TInstrument> = {
  1: {
    id: 1,
    changed: 1,
    title: 'US Dollar',
    shortTitle: 'USD',
    symbol: '$',
    rate: 1,
  },
}

function transaction(patch: Partial<TTransaction>): TTransaction {
  return {
    id: 'tr',
    changed: 1,
    created: 1,
    user: 1,
    deleted: false,
    hold: null,
    date: '2026-01-10',
    income: 0,
    incomeAccount: 'cash',
    incomeInstrument: 1,
    outcome: 0,
    outcomeAccount: 'card',
    outcomeInstrument: 1,
    tag: null,
    merchant: null,
    payee: null,
    originalPayee: null,
    comment: null,
    reminderMarker: null,
    opIncome: 0,
    opIncomeInstrument: null,
    opOutcome: 0,
    opOutcomeInstrument: null,
    latitude: null,
    longitude: null,
    ...patch,
  } as TTransaction
}
