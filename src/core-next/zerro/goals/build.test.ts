import { describe, expect, it } from 'vitest'
import { makeEnvMetrics, makeSortedActivity } from '../../testing/zerroTestData'
import { EnvType, envId } from '../envelope-id'
import { buildGoals } from './build'
import { goalType } from './types'

describe('buildGoals', () => {
  it('carries previous goal forward and applies monthly metrics', () => {
    const envelopeId = envId.get(EnvType.Tag, 'food')
    const result = buildGoals({
      rawGoals: {
        '2026-01': {
          [envelopeId]: { type: goalType.MONTHLY, amount: 100 },
        },
      },
      monthList: ['2026-01', '2026-02'],
      envMetrics: {
        '2026-01': {
          [envelopeId]: makeEnvMetrics({
            id: envelopeId,
            totalBudgeted: { USD: 25 },
          }),
        },
        '2026-02': {
          [envelopeId]: makeEnvMetrics({
            id: envelopeId,
            totalBudgeted: { USD: 50 },
          }),
        },
      },
      sortedActivity: {
        '2026-01': makeSortedActivity(),
        '2026-02': makeSortedActivity(),
      },
      convertFx: amount => amount.USD || 0,
    })

    expect(result['2026-01'][envelopeId]).toMatchObject({
      needNow: 75,
      needStart: 100,
      progress: 0.25,
    })
    expect(result['2026-02'][envelopeId]).toMatchObject({
      needNow: 50,
      needStart: 100,
      progress: 0.5,
    })
  })

  it('stops carrying deleted goals', () => {
    const envelopeId = envId.get(EnvType.Tag, 'food')
    const result = buildGoals({
      rawGoals: {
        '2026-01': {
          [envelopeId]: { type: goalType.MONTHLY, amount: 100 },
        },
        '2026-02': {
          [envelopeId]: null,
        },
      },
      monthList: ['2026-01', '2026-02'],
      envMetrics: {
        '2026-01': { [envelopeId]: makeEnvMetrics({ id: envelopeId }) },
        '2026-02': { [envelopeId]: makeEnvMetrics({ id: envelopeId }) },
      },
      sortedActivity: {
        '2026-01': makeSortedActivity(),
        '2026-02': makeSortedActivity(),
      },
      convertFx: amount => amount.USD || 0,
    })

    expect(result['2026-01'][envelopeId]).toBeDefined()
    expect(result['2026-02'][envelopeId]).toBeUndefined()
  })
})
