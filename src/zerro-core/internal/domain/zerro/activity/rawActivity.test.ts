import { describe, expect, it } from 'vitest'
import {
  makeTransaction,
  usdInstruments,
} from '../../../../support/testing/zenmoneyTestData'
import { EnvType, envId } from '../envelope-id'
import { buildSortedActivity } from './sortedActivity'
import { makeFxConverter } from '../../../../support/testing/zerroTestData'
import { buildRawActivity, EnvActivity } from './rawActivity'
import { buildActivityRoutingContext } from './transactionRouting'

describe('buildRawActivity', () => {
  it('groups income and outcome transactions by envelope', () => {
    const foodId = envId.get(EnvType.Tag, 'food')
    const result = buildRawActivity({
      transactions: [
        makeTransaction({
          id: 'outcome',
          outcome: 20,
          outcomeAccount: 'card',
          tag: ['food'],
        }),
        makeTransaction({
          id: 'income',
          income: 100,
          incomeAccount: 'card',
          tag: ['food'],
        }),
      ],
      routing: buildActivityRoutingContext({
        inBudgetAccountIds: ['card'],
        debtAccountId: undefined,
        debtors: {},
      }),
      instruments: usdInstruments,
    })

    expect(result['2026-01'].outcome[foodId].total).toEqual({ USD: -20 })
    expect(result['2026-01'].income[foodId].total).toEqual({ USD: 100 })
  })

  it('records internal transfer fees only when instruments or amounts differ', () => {
    const result = buildRawActivity({
      transactions: [
        makeTransaction({
          id: 'equal-transfer',
          income: 10,
          outcome: 10,
          incomeAccount: 'cash',
          outcomeAccount: 'card',
        }),
        makeTransaction({
          id: 'fee-transfer',
          income: 9,
          outcome: 10,
          incomeAccount: 'cash',
          outcomeAccount: 'card',
        }),
      ],
      routing: buildActivityRoutingContext({
        inBudgetAccountIds: ['card', 'cash'],
        debtAccountId: undefined,
        debtors: {},
      }),
      instruments: usdInstruments,
    })

    expect(result['2026-01'].internal.total).toEqual({ USD: -1 })
    expect(result['2026-01'].internal.transactionCount).toBe(1)
  })

  it('keeps a four-decimal native transfer fee through the monthly summary', () => {
    const rawActivity = buildRawActivity({
      transactions: [
        makeTransaction({
          income: 1,
          outcome: 1.0001,
          incomeAccount: 'cash',
          outcomeAccount: 'card',
        }),
      ],
      routing: buildActivityRoutingContext({
        inBudgetAccountIds: ['cash', 'card'],
        debtAccountId: undefined,
        debtors: {},
      }),
      instruments: usdInstruments,
    })
    const summary = buildSortedActivity({
      rawActivity,
      keepingEnvelopeIds: new Set(),
      convertFx: makeFxConverter({ USD: 1 }),
    })['2026-01']
    expect(summary.transfersTotal.total).toEqual({ USD: -0.0001 })
  })

  it('routes debt transactions through debtor envelopes', () => {
    const debtorId = envId.get(EnvType.Payee, 'alex')
    const result = buildRawActivity({
      transactions: [
        makeTransaction({
          id: 'debt',
          income: 50,
          incomeAccount: 'debt',
          outcome: 50,
          outcomeAccount: 'card',
          payee: 'Alex!',
        }),
      ],
      routing: buildActivityRoutingContext({
        inBudgetAccountIds: ['card'],
        debtAccountId: 'debt',
        debtors: { alex: { id: 'alex', merchantId: undefined } },
      }),
      instruments: usdInstruments,
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
