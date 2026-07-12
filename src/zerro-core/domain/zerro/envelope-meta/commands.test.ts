import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeReminder,
  makeStore,
  makeUser,
} from '../../../testing/zenmoneyTestData'
import { applyPatch } from '../../zenmoney'
import { EnvType, envId } from '../envelope-id'
import { HiddenDataType } from '../hidden-data'
import { compilePatchEnvelopeMeta } from './commands'
import { envelopeVisibility, getEnvelopeMeta } from './read'

describe('envelope meta commands', () => {
  it('patches one envelope meta record over existing hidden data', () => {
    const envelopeId = envId.get(EnvType.Tag, 'groceries')
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
      account: {
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
      reminder: {
        meta: makeReminder({
          id: 'meta',
          incomeAccount: 'data',
          outcomeAccount: 'data',
          comment: JSON.stringify({
            type: HiddenDataType.EnvelopeMeta,
            payload: {
              [envelopeId]: {
                id: envelopeId,
                visibility: envelopeVisibility.hidden,
                index: 3,
              },
            },
          }),
        }),
      },
    })

    const patch = compilePatchEnvelopeMeta(
      data,
      {
        id: envelopeId,
        visibility: envelopeVisibility.visible,
        group: 'fixed',
      },
      {
        now: () => 100,
        uuid: () => 'unused',
      }
    )
    const next = applyPatch(data, patch)

    expect(patch.account).toBeUndefined()
    expect(getEnvelopeMeta(next)).toEqual({
      [envelopeId]: {
        id: envelopeId,
        visibility: envelopeVisibility.visible,
        index: 3,
        group: 'fixed',
      },
    })
  })

  it('patches several envelope meta records and creates hidden data storage', () => {
    const tagEnvelopeId = envId.get(EnvType.Tag, 'groceries')
    const accountEnvelopeId = envId.get(EnvType.Account, 'cash')
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
    })
    const ids = ['data-account', 'meta-reminder']

    const patch = compilePatchEnvelopeMeta(
      data,
      [
        {
          id: tagEnvelopeId,
          visibility: envelopeVisibility.hidden,
        },
        {
          id: accountEnvelopeId,
          index: 2,
          keepIncome: true,
        },
      ],
      {
        now: () => 100,
        uuid: () => ids.shift() || 'unused',
      }
    )
    const next = applyPatch(data, patch)

    expect(patch.account).toEqual([
      makeAccount({
        id: 'data-account',
        changed: 100,
        title: '🤖 [Zerro Data]',
        user: 1,
        instrument: 2,
      }),
    ])
    expect(getEnvelopeMeta(next)).toEqual({
      [tagEnvelopeId]: {
        id: tagEnvelopeId,
        visibility: envelopeVisibility.hidden,
      },
      [accountEnvelopeId]: {
        id: accountEnvelopeId,
        index: 2,
        keepIncome: true,
      },
    })
  })
})
