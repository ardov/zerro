import { describe, expect, it } from 'vitest'
import {
  makeEnvActivity,
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
