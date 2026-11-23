import { describe, expect, it } from 'vitest'
import type { TNormalizedPatch } from '@/6-shared/types'
import { makeStore } from '../../../../support/testing/zenmoneyTestData'
import { applyPatch } from './applyPatch'

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
    } as TNormalizedPatch

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
      deletion: [{ object: 'tag', id: 'food' }],
    } as TNormalizedPatch)

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
    } as TNormalizedPatch)

    expect(next.account).not.toBe(base.account)
    expect(next.transaction).toBe(base.transaction)
    expect(next.tag).toBe(base.tag)
  })

  it('shares every entity map for a timestamp-only patch', () => {
    const base = makeStore({
      account: { cash: entity({ id: 'cash', title: 'Cash' }) },
    })

    const next = applyPatch(base, { serverTimestamp: 999 } as TNormalizedPatch)

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
      deletion: [{ object: 'tag', id: 'food' }],
    } as TNormalizedPatch)

    expect(next.tag).not.toBe(base.tag)
    expect(next.account).toBe(base.account)
  })
})

function entity<T extends { id: string | number }>(value: T) {
  return value as any
}
