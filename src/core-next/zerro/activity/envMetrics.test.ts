import { describe, expect, it } from 'vitest'
import type { ById } from '6-shared/types'
import { EnvType, envId } from '../envelope-id'
import { envelopeVisibility } from '../envelope-meta'
import type { TEnvelope } from '../envelopes'
import { buildActivity } from './activity'
import { buildEnvMetrics } from './envMetrics'
import { EnvActivity, TRawActivityNode } from './rawActivity'

describe('buildEnvMetrics', () => {
  it('rolls child overspend into parent availability', () => {
    const parentId = envId.get(EnvType.Tag, 'parent')
    const childId = envId.get(EnvType.Tag, 'child')
    const activity = buildActivity({
      rawActivity: {
        '2026-01': rawNode({
          outcome: {
            [childId]: envActivity({ USD: -25 }),
          },
        }),
      },
      keepingEnvelopeIds: [],
    })

    const result = buildEnvMetrics({
      monthList: ['2026-01'],
      envelopes: {
        [parentId]: envelope({ id: parentId, children: [childId] }),
        [childId]: envelope({ id: childId, parent: parentId }),
      },
      activity,
      budgets: {
        '2026-01': {
          [parentId]: 100,
        },
      },
      convertFx: amount => amount.USD || 0,
    })

    expect(result['2026-01'][childId].selfAvailable).toEqual({ USD: -25 })
    expect(result['2026-01'][parentId].childrenOverspend).toEqual({ USD: -25 })
    expect(result['2026-01'][parentId].selfAvailable).toEqual({ USD: 75 })
  })

  it('carries positive leftover into the next month', () => {
    const envelopeId = envId.get(EnvType.Tag, 'food')
    const result = buildEnvMetrics({
      monthList: ['2026-01', '2026-02'],
      envelopes: {
        [envelopeId]: envelope({ id: envelopeId }),
      },
      activity: {},
      budgets: {
        '2026-01': {
          [envelopeId]: 30,
        },
      },
      convertFx: amount => amount.USD || 0,
    })

    expect(result['2026-02'][envelopeId].selfLeftover).toEqual({ USD: 30 })
    expect(result['2026-02'][envelopeId].selfAvailable).toEqual({ USD: 30 })
  })
})

function envelope(patch: Partial<TEnvelope> & { id: TEnvelope['id'] }): TEnvelope {
  const { id, ...rest } = patch
  return {
    id,
    type: EnvType.Tag,
    entityId: 'entity',
    name: 'Envelope',
    originalName: 'Envelope',
    symbol: '',
    colorHex: null,
    colorGenerated: '#000000',
    colorDisplay: '#000000',
    children: [],
    parent: null,
    index: 0,
    indexRaw: undefined,
    visibility: envelopeVisibility.visible,
    group: 'Group',
    comment: '',
    currency: 'USD',
    keepIncome: false,
    carryNegatives: false,
    ...rest,
  }
}

function rawNode(patch: Partial<TRawActivityNode>): TRawActivityNode {
  return {
    internal: new EnvActivity(),
    income: {},
    outcome: {},
    ...patch,
  }
}

function envActivity(total: Record<string, number>): EnvActivity {
  const node = new EnvActivity()
  node.total = total
  return node
}
