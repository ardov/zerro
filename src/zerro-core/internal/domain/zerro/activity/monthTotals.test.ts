import { describe, expect, it } from 'vitest'
import {
  makeEnvActivity,
  makeEnvelope,
  makeRawActivityNode,
} from '../../../../support/testing/zerroTestData'
import { EnvType, envId } from '../envelope-id'
import { buildActivity } from './activity'
import { buildEnvMetrics } from './envMetrics'
import { buildMonthTotals } from './monthTotals'

describe('buildMonthTotals', () => {
  it('calculates free funds and positive to-be-assigned amount', () => {
    const envelopeId = envId.get(EnvType.Tag, 'food')
    const activity = buildActivity({
      rawActivity: {
        '2026-01': makeRawActivityNode({
          income: {
            [envelopeId]: makeEnvActivity({ USD: 100 }),
          },
          outcome: {
            [envelopeId]: makeEnvActivity({ USD: -20 }),
          },
        }),
      },
      keepingEnvelopeIds: new Set([]),
    })
    const envMetrics = buildEnvMetrics({
      monthList: ['2026-01'],
      envelopes: {
        [envelopeId]: makeEnvelope({ id: envelopeId }),
      },
      activity,
      budgets: {
        '2026-01': {
          [envelopeId]: 50,
        },
      },
      convertFx: amount => amount.USD || 0,
    })

    const result = buildMonthTotals({
      monthList: ['2026-01'],
      currentFunds: { USD: 200 },
      activity,
      envMetrics,
      convertFx: amount => amount.USD || 0,
      currentMonth: '2026-01',
    })

    expect(result['2026-01'].fundsChange).toEqual({ USD: 80 })
    expect(result['2026-01'].available).toEqual({ USD: 30 })
    expect(result['2026-01'].freeFunds).toEqual({ USD: 170 })
    expect(result['2026-01'].toBeAssigned).toEqual({ USD: 170 })
    expect(result['2026-01'].toBeAssignedState).toBe('positive')
  })

  it('reserves positive budgets from future months', () => {
    const envelopeId = envId.get(EnvType.Tag, 'food')
    const activity = {}
    const envMetrics = buildEnvMetrics({
      monthList: ['2026-01', '2026-02'],
      envelopes: {
        [envelopeId]: makeEnvelope({ id: envelopeId }),
      },
      activity,
      budgets: {
        '2026-02': {
          [envelopeId]: 40,
        },
      },
      convertFx: amount => amount.USD || 0,
    })

    const result = buildMonthTotals({
      monthList: ['2026-01', '2026-02'],
      currentFunds: { USD: 100 },
      activity,
      envMetrics,
      convertFx: amount => amount.USD || 0,
      currentMonth: '2026-01',
    })

    expect(result['2026-02'].positiveAssigned).toEqual({ USD: 40 })
    expect(result['2026-01'].assignedInFuture).toEqual({ USD: 40 })
    expect(result['2026-01'].toBeAssigned).toEqual({ USD: 60 })
  })
})
