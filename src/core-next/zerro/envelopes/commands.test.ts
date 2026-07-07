import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeStore,
  makeUser,
} from '../../testing/zenmoneyTestData'
import { makeEnvelope } from '../../testing/zerroTestData'
import { applyPatch } from '../../zenmoney'
import { EnvType, envId } from '../envelope-id'
import { envelopeVisibility, getEnvelopeMeta } from '../envelope-meta'
import { compilePatchEnvelopeMetadata } from './commands'

describe('envelope commands', () => {
  it('compiles envelope metadata patches', () => {
    const envelopeId = envId.get(EnvType.Account, 'cash')
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
      account: {
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
    })

    const patch = compilePatchEnvelopeMetadata(
      data,
      {
        [envelopeId]: makeEnvelope({
          id: envelopeId,
          type: EnvType.Account,
          visibility: envelopeVisibility.visible,
          indexRaw: undefined,
        }),
      },
      {
        id: envelopeId,
        visibility: envelopeVisibility.hidden,
        indexRaw: 4,
        keepIncome: true,
      },
      {
        now: () => 100,
        uuid: () => 'meta-reminder',
      }
    )
    const next = applyPatch(data, patch)

    expect(patch.account).toBeUndefined()
    expect(getEnvelopeMeta(next)).toEqual({
      [envelopeId]: {
        id: envelopeId,
        visibility: envelopeVisibility.hidden,
        index: 4,
        keepIncome: true,
      },
    })
  })

  it('normalizes non-tag parents to the top available parent', () => {
    const parentId = envId.get(EnvType.Account, 'parent')
    const childId = envId.get(EnvType.Account, 'child')
    const leafId = envId.get(EnvType.Account, 'leaf')
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
      account: {
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
    })

    const patch = compilePatchEnvelopeMetadata(
      data,
      {
        [parentId]: makeEnvelope({
          id: parentId,
          type: EnvType.Account,
          parent: null,
        }),
        [childId]: makeEnvelope({
          id: childId,
          type: EnvType.Account,
          parent: parentId,
        }),
        [leafId]: makeEnvelope({
          id: leafId,
          type: EnvType.Account,
          parent: null,
        }),
      },
      {
        id: leafId,
        parent: childId,
      },
      {
        now: () => 100,
        uuid: () => 'meta-reminder',
      }
    )
    const next = applyPatch(data, patch)

    expect(getEnvelopeMeta(next)[leafId]).toMatchObject({
      id: leafId,
      parent: parentId,
    })
  })

  it('keeps read-only, entity-owned, and unchanged fields as no-op patches', () => {
    const envelopeId = envId.get(EnvType.Tag, 'food')
    const data = makeStore()

    const patch = compilePatchEnvelopeMetadata(
      data,
      {
        [envelopeId]: makeEnvelope({
          id: envelopeId,
          type: EnvType.Tag,
          name: 'Food',
          originalName: 'Food',
          parent: null,
        }),
      },
      {
        id: envelopeId,
        name: 'Food',
        originalName: 'Groceries',
        colorHex: '#ff0000',
        parent: envId.get(EnvType.Tag, 'parent'),
      },
      {
        now: () => 100,
        uuid: () => 'unused',
      }
    )

    expect(patch).toEqual({})
  })
})
