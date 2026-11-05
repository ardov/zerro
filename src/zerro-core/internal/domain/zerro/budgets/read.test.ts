import { describe, expect, it } from 'vitest'
import {
  makeReminder,
  makeStore,
} from '../../../../support/testing/zenmoneyTestData'
import { envId, EnvType } from '../envelope-id'
import { HiddenDataType } from '../hidden-data'
import { getEnvBudgets } from './read'

describe('budget read helpers', () => {
  it('reads hidden monthly envelope budgets', () => {
    const envelopeId = envId.get(EnvType.Tag, 'food')
    const data = makeStore({
      reminder: {
        jan: makeReminder('jan', {
          type: HiddenDataType.Budgets,
          month: '2026-01',
          payload: { [envelopeId]: 100 },
        }),
      },
    })

    expect(getEnvBudgets(data.reminder)).toEqual({
      '2026-01': {
        [envelopeId]: 100,
      },
    })
  })
})
