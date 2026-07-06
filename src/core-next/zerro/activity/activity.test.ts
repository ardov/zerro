import { describe, expect, it } from 'vitest'
import {
  makeEnvActivity,
  makeRawActivityNode,
} from '../../testing/zerroTestData'
import { EnvType, envId } from '../envelope-id'
import { buildActivity } from './activity'

describe('buildActivity', () => {
  it('keeps selected income inside envelope activity', () => {
    const keepingId = envId.get(EnvType.Tag, 'salary')
    const regularId = envId.get(EnvType.Tag, 'bonus')
    const result = buildActivity({
      rawActivity: {
        '2026-01': makeRawActivityNode({
          income: {
            [keepingId]: makeEnvActivity({ USD: 100 }),
            [regularId]: makeEnvActivity({ USD: 20 }),
          },
        }),
      },
      keepingEnvelopeIds: [keepingId],
    })

    expect(result['2026-01'].total).toEqual({ USD: 120 })
    expect(result['2026-01'].envActivity.total).toEqual({ USD: 100 })
    expect(result['2026-01'].generalIncome.total).toEqual({ USD: 20 })
  })

  it('adds outcomes and transfer fees to total activity', () => {
    const foodId = envId.get(EnvType.Tag, 'food')
    const result = buildActivity({
      rawActivity: {
        '2026-01': makeRawActivityNode({
          internal: makeEnvActivity({ USD: -1 }),
          outcome: {
            [foodId]: makeEnvActivity({ USD: -20 }),
          },
        }),
      },
      keepingEnvelopeIds: [],
    })

    expect(result['2026-01'].total).toEqual({ USD: -21 })
    expect(result['2026-01'].transferFees.total).toEqual({ USD: -1 })
    expect(result['2026-01'].envActivity.total).toEqual({ USD: -20 })
  })

  it('merges income and outcome for keeping envelopes', () => {
    const envelopeId = envId.get(EnvType.Tag, 'project')
    const result = buildActivity({
      rawActivity: {
        '2026-01': makeRawActivityNode({
          income: {
            [envelopeId]: makeEnvActivity({ USD: 100 }),
          },
          outcome: {
            [envelopeId]: makeEnvActivity({ USD: -40 }),
          },
        }),
      },
      keepingEnvelopeIds: [envelopeId],
    })

    expect(result['2026-01'].envActivity.byEnv[envelopeId].total).toEqual({
      USD: 60,
    })
  })
})
