import { describe, expect, it } from 'vitest'
import { DataEntity, TDiff } from '6-shared/types'
import { makeStore } from '../testing/zenmoneyTestData'
import { applyPatch, applyPatchMutable, replay } from '.'

describe('zenmoney patch primitives', () => {
  it('applies upserts immutably', () => {
    const base = makeStore({
      account: {
        cash: entity({ id: 'cash', title: 'Cash' }),
      },
    })

    const patch = {
      serverTimestamp: 123,
      account: [
        entity({ id: 'cash', title: 'Cash updated' }),
        entity({ id: 'card', title: 'Card' }),
      ],
    } as TDiff

    const next = applyPatch(base, patch)

    expect(next).not.toBe(base)
    expect(next.account).not.toBe(base.account)
    expect(base.serverTimestamp).toBe(0)
    expect(base.account.cash.title).toBe('Cash')
    expect(next.serverTimestamp).toBe(123)
    expect(next.account.cash.title).toBe('Cash updated')
    expect(next.account.card.title).toBe('Card')
  })

  it('applies deletions immutably', () => {
    const base = makeStore({
      tag: {
        food: entity({ id: 'food', title: 'Food' }),
        fun: entity({ id: 'fun', title: 'Fun' }),
      },
    })

    const next = applyPatch(base, {
      deletion: [{ object: DataEntity.Tag, id: 'food' }],
    } as TDiff)

    expect(base.tag.food.title).toBe('Food')
    expect(next.tag.food).toBeUndefined()
    expect(next.tag.fun.title).toBe('Fun')
  })

  it('clones only the maps a patch touches and shares the rest', () => {
    const base = makeStore({
      account: { cash: entity({ id: 'cash', title: 'Cash' }) },
      transaction: { t1: entity({ id: 't1' }) },
      tag: { food: entity({ id: 'food', title: 'Food' }) },
    })

    const next = applyPatch(base, {
      account: [entity({ id: 'card', title: 'Card' })],
    } as TDiff)

    expect(next.account).not.toBe(base.account)
    expect(next.transaction).toBe(base.transaction)
    expect(next.tag).toBe(base.tag)
  })

  it('shares every entity map for a timestamp-only patch', () => {
    const base = makeStore({
      account: { cash: entity({ id: 'cash', title: 'Cash' }) },
    })

    const next = applyPatch(base, { serverTimestamp: 999 } as TDiff)

    expect(next).not.toBe(base)
    expect(next.serverTimestamp).toBe(999)
    expect(next.account).toBe(base.account)
    expect(next.transaction).toBe(base.transaction)
  })

  it('clones only the deleted entity map', () => {
    const base = makeStore({
      tag: { food: entity({ id: 'food', title: 'Food' }) },
      account: { cash: entity({ id: 'cash', title: 'Cash' }) },
    })

    const next = applyPatch(base, {
      deletion: [{ object: DataEntity.Tag, id: 'food' }],
    } as TDiff)

    expect(next.tag).not.toBe(base.tag)
    expect(next.account).toBe(base.account)
  })

  it('applies patches mutably when requested', () => {
    const store = makeStore()

    applyPatchMutable(store, {
      merchant: [entity({ id: 'shop', title: 'Shop' })],
    } as TDiff)

    expect(store.merchant.shop.title).toBe('Shop')
  })

  it('replays patches over base in order', () => {
    const base = makeStore()

    const next = replay(base, [
      { account: [entity({ id: 'cash', title: 'Cash' })] },
      { account: [entity({ id: 'cash', title: 'Cash renamed' })] },
      { deletion: [{ object: DataEntity.Account, id: 'cash' }] },
    ] as TDiff[])

    expect(base.account.cash).toBeUndefined()
    expect(next.account.cash).toBeUndefined()
  })
})

function entity<T extends { id: string | number }>(value: T) {
  return value as any
}
