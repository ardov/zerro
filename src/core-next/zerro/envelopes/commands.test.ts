import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeMerchant,
  makeStore,
  makeTag,
  makeUser,
} from '../../testing/zenmoneyTestData'
import { makeEnvelope } from '../../testing/zerroTestData'
import { applyPatch } from '../../zenmoney'
import { EnvType, envId } from '../envelope-id'
import { envelopeVisibility, getEnvelopeMeta } from '../envelope-meta'
import { compilePatchEnvelope, compilePatchEnvelopeMetadata } from './commands'

describe('envelope commands', () => {
  it('compiles entity-owned and metadata envelope patches together', () => {
    const tagId = envId.get(EnvType.Tag, 'food')
    const tagParentId = envId.get(EnvType.Tag, 'parent')
    const accountId = envId.get(EnvType.Account, 'cash')
    const merchantId = envId.get(EnvType.Merchant, 'shop')
    const data = makeStore({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 2 }),
      },
      account: {
        cash: makeAccount({ id: 'cash', title: 'Cash', changed: 1 }),
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
      tag: {
        food: makeTag({ id: 'food', title: 'Food', changed: 1 }),
        parent: makeTag({ id: 'parent', title: 'Parent', changed: 1 }),
      },
      merchant: {
        shop: makeMerchant({ id: 'shop', title: 'Shop', changed: 1 }),
      },
    })
    const timestamps = [100, 200, 300, 400]

    const patch = compilePatchEnvelope(
      data,
      {
        [tagId]: makeEnvelope({
          id: tagId,
          type: EnvType.Tag,
          entityId: 'food',
          originalName: 'Food',
          colorHex: null,
          parent: null,
        }),
        [tagParentId]: makeEnvelope({
          id: tagParentId,
          type: EnvType.Tag,
          entityId: 'parent',
          parent: null,
        }),
        [accountId]: makeEnvelope({
          id: accountId,
          type: EnvType.Account,
          entityId: 'cash',
          originalName: 'Cash',
          keepIncome: false,
        }),
        [merchantId]: makeEnvelope({
          id: merchantId,
          type: EnvType.Merchant,
          entityId: 'shop',
          originalName: 'Shop',
        }),
      },
      [
        {
          id: tagId,
          originalName: 'Groceries',
          colorHex: '#00ff00',
          parent: tagParentId,
        },
        {
          id: accountId,
          originalName: 'Wallet',
          keepIncome: true,
        },
        {
          id: merchantId,
          originalName: 'Market',
        },
      ],
      {
        now: () => timestamps.shift() || 0,
        uuid: () => 'meta-reminder',
      }
    )
    const next = applyPatch(data, patch)

    expect(patch.tag?.[0]).toMatchObject({
      id: 'food',
      title: 'Groceries',
      color: 65280,
      parent: 'parent',
      changed: 100,
    })
    expect(patch.account?.[0]).toMatchObject({
      id: 'cash',
      title: 'Wallet',
      changed: 200,
    })
    expect(patch.merchant?.[0]).toMatchObject({
      id: 'shop',
      title: 'Market',
      changed: 300,
    })
    expect(getEnvelopeMeta(next)[accountId]).toEqual({
      id: accountId,
      keepIncome: true,
    })
  })

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

  it('rejects non-tag parents for tag envelopes', () => {
    const tagId = envId.get(EnvType.Tag, 'food')
    const accountId = envId.get(EnvType.Account, 'cash')

    expect(() =>
      compilePatchEnvelope(
        makeStore(),
        {
          [tagId]: makeEnvelope({
            id: tagId,
            type: EnvType.Tag,
            parent: null,
          }),
          [accountId]: makeEnvelope({
            id: accountId,
            type: EnvType.Account,
            parent: null,
          }),
        },
        {
          id: tagId,
          parent: accountId,
        },
        {
          now: () => 100,
          uuid: () => 'unused',
        }
      )
    ).toThrow('Parent is not tag')
  })
})
