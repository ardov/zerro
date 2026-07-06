import { describe, expect, it } from 'vitest'
import { EnvType, envId } from '../envelope-id'
import { buildSortedActivity, TrFilterMode } from './sortedActivity'
import { EnvActivity, TRawActivityNode } from './rawActivity'

describe('buildSortedActivity', () => {
  it('separates general income and envelope outcome for regular tags', () => {
    const foodId = envId.get(EnvType.Tag, 'food')
    const result = buildSortedActivity({
      rawActivity: {
        '2026-01': rawNode({
          income: {
            [foodId]: activity({ USD: 100 }),
          },
          outcome: {
            [foodId]: activity({ USD: -20 }),
          },
        }),
      },
      keepingEnvelopeIds: [],
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
        '2026-01': rawNode({
          income: {
            [projectId]: activity({ USD: 100 }),
          },
          outcome: {
            [projectId]: activity({ USD: -40 }),
          },
        }),
      },
      keepingEnvelopeIds: [projectId],
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
        '2026-01': rawNode({
          internal: activity({ USD: -1 }),
          income: {
            [accountId]: activity({ USD: 10 }),
            [debtorId]: activity({ USD: 20 }),
          },
        }),
      },
      keepingEnvelopeIds: [],
      convertFx: amount => amount.USD || 0,
    })

    expect(result['2026-01'].transfers.map(node => node.id)).toEqual([
      accountId,
      'transferFees',
    ])
    expect(result['2026-01'].debts.map(node => node.id)).toEqual([debtorId])
  })
})

function rawNode(patch: Partial<TRawActivityNode>): TRawActivityNode {
  return {
    internal: new EnvActivity(),
    income: {},
    outcome: {},
    ...patch,
  }
}

function activity(total: Record<string, number>): EnvActivity {
  const node = new EnvActivity()
  node.total = total
  return node
}
