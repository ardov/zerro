import { describe, expect, it } from 'vitest'
import type { TEnvMetrics } from '../activity/envMetrics'
import { EnvActivity } from '../activity/rawActivity'
import type { TSortedActivity } from '../activity/sortedActivity'
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
          [envelopeId]: envMetrics({ id: envelopeId, totalBudgeted: { USD: 25 } }),
        },
        '2026-02': {
          [envelopeId]: envMetrics({ id: envelopeId, totalBudgeted: { USD: 50 } }),
        },
      },
      sortedActivity: {
        '2026-01': sortedActivity(),
        '2026-02': sortedActivity(),
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
        '2026-01': { [envelopeId]: envMetrics({ id: envelopeId }) },
        '2026-02': { [envelopeId]: envMetrics({ id: envelopeId }) },
      },
      sortedActivity: {
        '2026-01': sortedActivity(),
        '2026-02': sortedActivity(),
      },
      convertFx: amount => amount.USD || 0,
    })

    expect(result['2026-01'][envelopeId]).toBeDefined()
    expect(result['2026-02'][envelopeId]).toBeUndefined()
  })
})

function envMetrics(
  patch: Partial<TEnvMetrics> & { id: TEnvMetrics['id'] }
): TEnvMetrics {
  const { id, ...rest } = patch
  return {
    id,
    name: 'Envelope',
    parent: null,
    children: [],
    currency: 'USD',
    carryNegatives: false,
    selfTransactions: [],
    selfLeftover: {},
    selfBudgeted: {},
    selfActivity: {},
    selfAvailable: {},
    childrenTransactions: [],
    childrenLeftover: {},
    childrenBudgeted: {},
    childrenActivity: {},
    childrenSurplus: {},
    childrenOverspend: {},
    totalTransactions: [],
    totalLeftover: {},
    totalBudgeted: {},
    totalActivity: {},
    totalAvailable: {},
    ...rest,
  }
}

function sortedActivity(): TSortedActivity {
  return {
    incomes: [],
    outcomes: [],
    transfers: [],
    debts: [],
    incomesTotal: new EnvActivity(),
    outcomesTotal: new EnvActivity(),
    transfersTotal: new EnvActivity(),
    debtsTotal: new EnvActivity(),
  }
}
