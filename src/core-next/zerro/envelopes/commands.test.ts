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
import {
  compileApplyEnvelopeStructure,
  compileCreateEnvelope,
  compilePatchEnvelope,
  compilePatchEnvelopeMetadata,
  compileRenameEnvelope,
  compileSetEnvelopeColor,
  compileSetEnvelopeComment,
  compileUpdateEnvelopeSettings,
} from './commands'

describe('envelope commands', () => {
  it('creates a tag and initial envelope metadata with an id receipt', () => {
    const data = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
      account: {
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
    })
    const ids = ['new-tag', 'meta-reminder']

    const result = compileCreateEnvelope(
      data,
      {
        name: 'Travel',
        group: 'Plans',
        index: 2,
        comment: 'Save for a trip',
      },
      { now: () => 100, uuid: () => ids.shift() || 'unexpected-id' }
    )
    const next = applyPatch(data, result.patch)
    const id = envId.get(EnvType.Tag, 'new-tag')

    expect(result.receipt.envelopeId).toBe(id)
    expect(next.tag['new-tag']).toMatchObject({
      title: 'Travel',
      showOutcome: true,
    })
    expect(getEnvelopeMeta(next)[id]).toMatchObject({
      id,
      group: 'Plans',
      index: 2,
      comment: 'Save for a trip',
    })
  })

  it('updates explicit envelope settings atomically', () => {
    const id = envId.get(EnvType.Tag, 'food')
    const data = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
      account: {
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
      tag: { food: makeTag({ id: 'food', title: 'Food', color: null }) },
    })
    const envelopes = {
      [id]: makeEnvelope({
        id,
        originalName: 'Food',
        colorHex: null,
        currency: 'USD',
        visibility: envelopeVisibility.auto,
        keepIncome: false,
      }),
    }
    const ctx = { now: () => 100, uuid: () => 'meta-reminder' }

    expect(
      compileUpdateEnvelopeSettings(
        data,
        envelopes,
        {
          id,
          name: 'Food',
          colorHex: null,
          currency: 'USD',
          visibility: envelopeVisibility.auto,
          keepIncome: false,
        },
        ctx
      )
    ).toEqual({})

    const patch = compileUpdateEnvelopeSettings(
      data,
      envelopes,
      {
        id,
        name: 'Groceries',
        colorHex: '#00ff00',
        currency: 'EUR',
        visibility: envelopeVisibility.hidden,
        keepIncome: true,
      },
      ctx
    )
    const next = applyPatch(data, patch)

    expect(next.tag.food).toMatchObject({
      title: 'Groceries',
      color: 0x00ff00,
    })
    expect(getEnvelopeMeta(next)[id]).toMatchObject({
      currency: 'EUR',
      visibility: envelopeVisibility.hidden,
      keepIncome: true,
    })
  })

  it('sets, clears, and skips unchanged envelope comments', () => {
    const id = envId.get(EnvType.Tag, 'food')
    const data = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
      account: {
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
    })
    const ctx = { now: () => 100, uuid: () => 'meta-reminder' }

    expect(compileSetEnvelopeComment(data, { id, comment: '' }, ctx)).toEqual(
      {}
    )

    const withComment = applyPatch(
      data,
      compileSetEnvelopeComment(data, { id, comment: 'Notes' }, ctx)
    )
    const cleared = applyPatch(
      withComment,
      compileSetEnvelopeComment(withComment, { id, comment: '' }, ctx)
    )

    expect(getEnvelopeMeta(withComment)[id]?.comment).toBe('Notes')
    expect(getEnvelopeMeta(cleared)[id]?.comment).toBe('')
  })

  it('sets, clears, and skips unchanged tag envelope colors', () => {
    const data = makeStore({
      tag: { food: makeTag({ id: 'food', title: 'Food', color: null }) },
    })
    const coloredData = makeStore({
      tag: { food: makeTag({ id: 'food', title: 'Food', color: 0x00ff00 }) },
    })
    const id = envId.get(EnvType.Tag, 'food')
    const ctx = { now: () => 100 }

    const colored = applyPatch(
      data,
      compileSetEnvelopeColor(data, { id, colorHex: '#00ff00' }, ctx)
    )
    const cleared = applyPatch(
      coloredData,
      compileSetEnvelopeColor(coloredData, { id, colorHex: null }, ctx)
    )

    expect(colored.tag.food.color).toBe(0x00ff00)
    expect(cleared.tag.food.color).toBeNull()
    expect(compileSetEnvelopeColor(data, { id, colorHex: null }, ctx)).toEqual(
      {}
    )
  })

  it('rejects invalid, uncategorized, and non-tag envelope colors', () => {
    const data = makeStore({
      tag: { food: makeTag({ id: 'food', title: 'Food' }) },
    })
    const ctx = { now: () => 100 }

    expect(() =>
      compileSetEnvelopeColor(
        data,
        { id: envId.get(EnvType.Tag, 'food'), colorHex: 'red' },
        ctx
      )
    ).toThrow('Invalid envelope color')
    expect(() =>
      compileSetEnvelopeColor(
        data,
        { id: envId.get(EnvType.Tag, null), colorHex: '#ff0000' },
        ctx
      )
    ).toThrow('Uncategorized envelope color cannot be changed')
    expect(() =>
      compileSetEnvelopeColor(
        data,
        { id: envId.get(EnvType.Account, 'cash'), colorHex: '#ff0000' },
        ctx
      )
    ).toThrow('Only tag envelopes have configurable colors')
  })

  it('renames tag, account, and merchant envelopes through entity commands', () => {
    const data = makeStore({
      tag: { food: makeTag({ id: 'food', title: 'Food' }) },
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
      merchant: { shop: makeMerchant({ id: 'shop', title: 'Shop' }) },
    })
    const ctx = { now: () => 100 }

    const renamedTag = applyPatch(
      data,
      compileRenameEnvelope(
        data,
        { id: envId.get(EnvType.Tag, 'food'), name: 'Groceries' },
        ctx
      )
    )
    const renamedAccount = applyPatch(
      data,
      compileRenameEnvelope(
        data,
        { id: envId.get(EnvType.Account, 'cash'), name: 'Wallet' },
        ctx
      )
    )
    const renamedMerchant = applyPatch(
      data,
      compileRenameEnvelope(
        data,
        { id: envId.get(EnvType.Merchant, 'shop'), name: 'Market' },
        ctx
      )
    )

    expect(renamedTag.tag.food.title).toBe('Groceries')
    expect(renamedAccount.account.cash.title).toBe('Wallet')
    expect(renamedMerchant.merchant.shop.title).toBe('Market')
  })

  it('rejects payee rename and skips unchanged names', () => {
    const data = makeStore({
      tag: { food: makeTag({ id: 'food', title: 'Food' }) },
    })
    const ctx = { now: () => 100 }

    expect(
      compileRenameEnvelope(
        data,
        { id: envId.get(EnvType.Tag, 'food'), name: 'Food' },
        ctx
      )
    ).toEqual({})
    expect(() =>
      compileRenameEnvelope(
        data,
        { id: envId.get(EnvType.Payee, 'Alex'), name: 'Alexander' },
        ctx
      )
    ).toThrow('Payee envelopes cannot be renamed')
  })

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

  it('applies reorder, regroup, and reparent structure as one atomic patch', () => {
    const foodId = envId.get(EnvType.Tag, 'food')
    const funId = envId.get(EnvType.Tag, 'fun')
    const parentId = envId.get(EnvType.Tag, 'parent')
    const cashId = envId.get(EnvType.Account, 'cash')
    const data = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
      account: {
        cash: makeAccount({ id: 'cash', title: 'Cash' }),
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
      tag: {
        food: makeTag({ id: 'food', title: 'Food' }),
        fun: makeTag({ id: 'fun', title: 'Fun' }),
        parent: makeTag({ id: 'parent', title: 'Parent' }),
      },
    })
    const envelopes = {
      [foodId]: makeEnvelope({
        id: foodId,
        entityId: 'food',
        group: 'Costs',
        parent: null,
        indexRaw: 1,
      }),
      [funId]: makeEnvelope({
        id: funId,
        entityId: 'fun',
        group: 'Costs',
        parent: null,
        indexRaw: 2,
      }),
      [parentId]: makeEnvelope({
        id: parentId,
        entityId: 'parent',
        group: 'Costs',
        parent: null,
        indexRaw: 3,
      }),
      [cashId]: makeEnvelope({
        id: cashId,
        type: EnvType.Account,
        entityId: 'cash',
        group: 'Costs',
        parent: null,
        indexRaw: 4,
      }),
    }

    const patch = compileApplyEnvelopeStructure(
      data,
      envelopes,
      [
        {
          group: 'Costs',
          children: [{ id: parentId, children: [{ id: foodId }] }],
        },
        { group: 'Savings', children: [{ id: cashId }, { id: funId }] },
      ],
      { now: () => 100, uuid: () => 'meta-reminder' }
    )
    const next = applyPatch(data, patch)
    const meta = getEnvelopeMeta(next)

    // Flat order: [Costs, parent, food, Savings, cash, fun]
    expect(next.tag.food.parent).toBe('parent')
    expect(meta[parentId]).toMatchObject({ index: 1 })
    expect(meta[foodId]).toMatchObject({ index: 2 })
    expect(meta[cashId]).toEqual({ id: cashId, group: 'Savings' })
    expect(meta[funId]).toMatchObject({ group: 'Savings', index: 5 })
  })

  it('elevates tags under virtual envelopes and flattens deep nesting', () => {
    const virtId = envId.get(EnvType.Account, 'virt')
    const tId = envId.get(EnvType.Tag, 't')
    const pId = envId.get(EnvType.Tag, 'p')
    const c1Id = envId.get(EnvType.Tag, 'c1')
    const c2Id = envId.get(EnvType.Tag, 'c2')
    const data = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
      account: {
        virt: makeAccount({ id: 'virt', title: 'Virtual' }),
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
      tag: {
        t: makeTag({ id: 't', title: 'T' }),
        p: makeTag({ id: 'p', title: 'P' }),
        c1: makeTag({ id: 'c1', title: 'C1' }),
        c2: makeTag({ id: 'c2', title: 'C2' }),
      },
    })
    const envelopes = {
      [virtId]: makeEnvelope({
        id: virtId,
        type: EnvType.Account,
        entityId: 'virt',
        group: 'G',
        parent: null,
        indexRaw: 1,
      }),
      [tId]: makeEnvelope({
        id: tId,
        entityId: 't',
        group: 'Other',
        parent: null,
        indexRaw: 6,
      }),
      [pId]: makeEnvelope({
        id: pId,
        entityId: 'p',
        group: 'G',
        parent: null,
        indexRaw: 3,
      }),
      [c1Id]: makeEnvelope({
        id: c1Id,
        entityId: 'c1',
        group: 'G',
        parent: pId,
        indexRaw: 4,
      }),
      [c2Id]: makeEnvelope({
        id: c2Id,
        entityId: 'c2',
        group: 'G',
        parent: c1Id,
        indexRaw: 5,
      }),
    }

    const patch = compileApplyEnvelopeStructure(
      data,
      envelopes,
      [
        {
          group: 'G',
          children: [
            { id: virtId, children: [{ id: tId }] },
            { id: pId, children: [{ id: c1Id, children: [{ id: c2Id }] }] },
          ],
        },
      ],
      { now: () => 100, uuid: () => 'meta-reminder' }
    )
    const next = applyPatch(data, patch)
    const meta = getEnvelopeMeta(next)

    // Flat order: [G, virt, t (elevated), p, c2, c1]
    expect(next.tag.t.parent).toBeNull()
    expect(next.tag.c2.parent).toBe('p')
    expect(meta[tId]).toMatchObject({ group: 'G', index: 2 })
    expect(meta[c2Id]).toMatchObject({ index: 4 })
    expect(meta[c1Id]).toMatchObject({ index: 5 })
  })

  it('merges same-named groups, drops empty ones, and skips no-op structures', () => {
    const foodId = envId.get(EnvType.Tag, 'food')
    const funId = envId.get(EnvType.Tag, 'fun')
    const data = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
      account: {
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
      tag: {
        food: makeTag({ id: 'food', title: 'Food' }),
        fun: makeTag({ id: 'fun', title: 'Fun' }),
      },
    })
    const envelopes = {
      [foodId]: makeEnvelope({
        id: foodId,
        entityId: 'food',
        group: 'A',
        parent: null,
        indexRaw: 1,
      }),
      [funId]: makeEnvelope({
        id: funId,
        entityId: 'fun',
        group: 'B',
        parent: null,
        indexRaw: 3,
      }),
    }
    const ctx = { now: () => 100, uuid: () => 'meta-reminder' }

    expect(
      compileApplyEnvelopeStructure(
        data,
        envelopes,
        [
          { group: 'A', children: [{ id: foodId }] },
          { group: 'B', children: [{ id: funId }] },
        ],
        ctx
      )
    ).toEqual({})

    const merged = compileApplyEnvelopeStructure(
      data,
      envelopes,
      [
        { group: 'A', children: [{ id: foodId }] },
        { group: 'Empty', children: [] },
        { group: 'A', children: [{ id: funId }] },
      ],
      ctx
    )
    const next = applyPatch(data, merged)
    const meta = getEnvelopeMeta(next)

    // Flat order: [A, food, fun] — the empty group takes no index
    expect(meta[foodId]).toBeUndefined()
    expect(meta[funId]).toEqual({ id: funId, group: 'A', index: 2 })
  })

  it('rejects structures with unknown envelopes', () => {
    expect(() =>
      compileApplyEnvelopeStructure(
        makeStore(),
        {},
        [
          {
            group: 'A',
            children: [{ id: envId.get(EnvType.Tag, 'ghost') }],
          },
        ],
        { now: () => 100, uuid: () => 'unused' }
      )
    ).toThrow('Envelope not found')
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
