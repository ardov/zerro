import { describe, expect, it } from 'vitest'
import {
  makeEnvActivity,
  makeFxConverter,
  makeRawActivityNode,
} from '../../../../support/testing/zerroTestData'
import { EnvType, envId } from '../envelope-id'
import { buildSortedActivity, TrFilterMode } from './sortedActivity'

describe('buildSortedActivity', () => {
  it('separates general income and envelope outcome for regular tags', () => {
    const foodId = envId.get(EnvType.Tag, 'food')
    const result = buildSortedActivity({
      rawActivity: {
        '2026-01': makeRawActivityNode({
          income: {
            [foodId]: makeEnvActivity({ USD: 100 }),
          },
          outcome: {
            [foodId]: makeEnvActivity({ USD: -20 }),
          },
        }),
      },
      keepingEnvelopeIds: new Set([]),
      convertFx: amount => amount.USD || 0,
    })

    expect(result['2026-01'].incomes[0]).toMatchObject({
      id: foodId,
      trMode: TrFilterMode.GeneralIncome,
    })
    expect(result['2026-01'].outcomes[0]).toMatchObject({
      id: foodId,
      trMode: TrFilterMode.Envelope,
    })
    expect(result['2026-01'].incomesTotal.total).toEqual({ USD: 100 })
    expect(result['2026-01'].outcomesTotal.total).toEqual({ USD: -20 })
  })

  it('merges keeping envelope income and outcome into one sorted node', () => {
    const projectId = envId.get(EnvType.Tag, 'project')
    const result = buildSortedActivity({
      rawActivity: {
        '2026-01': makeRawActivityNode({
          income: {
            [projectId]: makeEnvActivity({ USD: 100 }),
          },
          outcome: {
            [projectId]: makeEnvActivity({ USD: -40 }),
          },
        }),
      },
      keepingEnvelopeIds: new Set([projectId]),
      convertFx: amount => amount.USD || 0,
    })

    expect(result['2026-01'].incomes).toHaveLength(1)
    expect(result['2026-01'].outcomes).toHaveLength(0)
    expect(result['2026-01'].incomes[0].total.total).toEqual({ USD: 60 })
  })

  it('keeps tiny retained income and transfer fees in their own groups', () => {
    const id = envId.get(EnvType.Tag, 'project')
    const result = buildSortedActivity({
      rawActivity: {
        '2026-01': makeRawActivityNode({
          income: { [id]: makeEnvActivity({ DASH: 0.01 }) },
          internal: makeEnvActivity({ DASH: -0.02 }),
        }),
      },
      keepingEnvelopeIds: new Set([id]),
      convertFx: makeFxConverter({ USD: 1, DASH: 0.00004 }),
    })['2026-01']
    expect(result.incomesTotal.total).toEqual({ DASH: 0.01 })
    expect(result.outcomes).toHaveLength(0)
    expect(result.transfersTotal.total).toEqual({ DASH: -0.02 })
  })

  it('omits the fee of a transfer whose two currency legs cancel at the monthly rate', () => {
    const result = buildSortedActivity({
      rawActivity: {
        '2026-01': makeRawActivityNode({
          internal: makeEnvActivity({ EUR: 100, USD: -110 }),
        }),
      },
      keepingEnvelopeIds: new Set(),
      convertFx: makeFxConverter({ USD: 1, EUR: 1.1 }),
    })['2026-01']
    expect(result.transfers).toHaveLength(0)
  })

  it('routes transfers, debts, and transfer fees into separate groups', () => {
    const accountId = envId.get(EnvType.Account, 'safe')
    const debtorId = envId.get(EnvType.Payee, 'alex')
    const result = buildSortedActivity({
      rawActivity: {
        '2026-01': makeRawActivityNode({
          internal: makeEnvActivity({ USD: -1 }),
          income: {
            [accountId]: makeEnvActivity({ USD: 10 }),
            [debtorId]: makeEnvActivity({ USD: 20 }),
          },
        }),
      },
      keepingEnvelopeIds: new Set([]),
      convertFx: amount => amount.USD || 0,
    })

    expect(result['2026-01'].transfers.map(node => node.id)).toEqual([
      accountId,
      'transferFees',
    ])
    expect(result['2026-01'].debts.map(node => node.id)).toEqual([debtorId])
  })
})
