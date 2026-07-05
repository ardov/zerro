import { describe, expect, it } from 'vitest'
import type { TDataStore, TReminder } from '6-shared/types'
import { envId, EnvType } from '../envelope-id'
import { HiddenDataType } from '../hidden-data'
import { envelopeVisibility, getEnvelopeMeta } from './read'

describe('envelope meta read helpers', () => {
  it('returns an empty object by default', () => {
    expect(getEnvelopeMeta(makeStore())).toEqual({})
  })

  it('reads envelope meta from hidden data', () => {
    const envelopeId = envId.get(EnvType.Tag, 'groceries')
    const data = makeStore({
      reminder: {
        meta: reminder('meta', {
          type: HiddenDataType.EnvelopeMeta,
          payload: {
            [envelopeId]: {
              id: envelopeId,
              visibility: envelopeVisibility.hidden,
              index: 3,
            },
          },
        }),
      },
    })

    expect(getEnvelopeMeta(data)).toEqual({
      [envelopeId]: {
        id: envelopeId,
        visibility: envelopeVisibility.hidden,
        index: 3,
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
