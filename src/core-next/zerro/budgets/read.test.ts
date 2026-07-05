import { describe, expect, it } from 'vitest'
import type { TDataStore, TReminder } from '6-shared/types'
import { envId, EnvType } from '../envelope-id'
import { HiddenDataType } from '../hidden-data'
import { getEnvBudgets } from './read'

describe('budget read helpers', () => {
  it('reads hidden monthly envelope budgets', () => {
    const envelopeId = envId.get(EnvType.Tag, 'food')
    const data = makeStore({
      reminder: {
        jan: reminder('jan', {
          type: HiddenDataType.Budgets,
          month: '2026-01',
          payload: { [envelopeId]: 100 },
        }),
      },
    })

    expect(getEnvBudgets(data)).toEqual({
      '2026-01': {
        [envelopeId]: 100,
      },
    })
  })
})

function reminder(id: string, comment: unknown): TReminder {
  return {
    id,
    comment: JSON.stringify(comment),
  } as TReminder
}

function makeStore(patch: Partial<TDataStore> = {}): TDataStore {
  return {
    serverTimestamp: 0,
    instrument: {},
    country: {},
    company: {},
    user: {},
    merchant: {},
    account: {},
    tag: {},
    budget: {},
    reminder: {},
    reminderMarker: {},
    transaction: {},
    ...patch,
  } as TDataStore
}
