import { describe, expect, it } from 'vitest'
import { DataEntity, TDataStore, TDiff } from '6-shared/types'
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

function entity<T extends { id: string | number }>(value: T) {
  return value as any
}
