import { describe, expect, it } from 'vitest'
import {
  makeEnvActivity,
  makeEnvelope,
  makeRawActivityNode,
} from '../../../../support/testing/zerroTestData'
import { EnvType, envId } from '../envelope-id'
import { buildEnvelopes, uncategorizedEnvelopeName } from '../envelopes'
import { buildActivity } from './activity'
import { buildEnvMetrics } from './envMetrics'

describe('buildEnvMetrics', () => {
  it('rolls child overspend into parent availability', () => {
    const parentId = envId.get(EnvType.Tag, 'parent')
    const childId = envId.get(EnvType.Tag, 'child')
    const childActivity = makeEnvActivity({ USD: -25 })
    childActivity.transactionCount = 1
    const activity = buildActivity({
      rawActivity: {
        '2026-01': makeRawActivityNode({
          outcome: {
            [childId]: childActivity,
          },
        }),
      },
      keepingEnvelopeIds: new Set([]),
    })

    const result = buildEnvMetrics({
      monthList: ['2026-01'],
      envelopes: {
        [parentId]: makeEnvelope({ id: parentId, children: [childId] }),
        [childId]: makeEnvelope({ id: childId, parent: parentId }),
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
    expect(result['2026-01'][childId].selfTransactionCount).toBe(1)
    expect(result['2026-01'][parentId]).toMatchObject({
      selfTransactionCount: 0,
      childrenTransactionCount: 1,
      totalTransactionCount: 1,
    })
  })

  it('carries positive leftover into the next month', () => {
    const envelopeId = envId.get(EnvType.Tag, 'food')
    const result = buildEnvMetrics({
      monthList: ['2026-01', '2026-02'],
      envelopes: {
        [envelopeId]: makeEnvelope({ id: envelopeId }),
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

  it('calculates uncategorized activity without legacy null tag input', () => {
    const nullTagId = envId.get(EnvType.Tag, null)
    const envelopes = buildEnvelopes({
      userCurrency: 'USD',
      tags: {},
      savingAccounts: [],
      envelopeMeta: {},
      debtors: {},
    }).byId
    const activity = buildActivity({
      rawActivity: {
        '2026-01': makeRawActivityNode({
          outcome: {
            [nullTagId]: makeEnvActivity({ USD: -15 }),
          },
        }),
      },
      keepingEnvelopeIds: new Set([]),
    })

    const result = buildEnvMetrics({
      monthList: ['2026-01'],
      envelopes,
      activity,
      budgets: {
        '2026-01': {
          [nullTagId]: 50,
        },
      },
      convertFx: amount => amount.USD || 0,
    })

    expect(result['2026-01'][nullTagId]).toMatchObject({
      name: uncategorizedEnvelopeName,
      selfAssigned: { USD: 50 },
      selfActivity: { USD: -15 },
      selfAvailable: { USD: 35 },
    })
  })
})
