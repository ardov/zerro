import { describe, expect, it } from 'vitest'
import { makeReminder, makeStore } from '../../../testing/zenmoneyTestData'
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
        meta: makeReminder('meta', {
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
