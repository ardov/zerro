import { describe, expect, it } from 'vitest'
import { makeStore } from '../../../support/testing/zenmoneyTestData'
import { applyCompactTransition, compactCanonicalTransition } from './journal'

describe('canonical journal transitions', () => {
  it('stores only changed entity fields and replay reproduces the target', () => {
    const before = makeStore({
      serverTimestamp: 10,
      account: { cash: row({ id: 'cash', title: 'Cash', balance: 100 }) },
      tag: { old: row({ id: 'old', title: 'Old' }) },
    })
    const after = makeStore({
      serverTimestamp: 11,
      account: {
        cash: row({ id: 'cash', title: 'Wallet', balance: 100 }),
        card: row({ id: 'card', title: 'Card' }),
      },
    })

    const transition = compactCanonicalTransition(before, after)

    expect(transition).toEqual({
      serverTimestamp: 11,
      upsert: {
        account: [
          { id: 'cash', fields: { title: 'Wallet' } },
          { id: 'card', fields: { title: 'Card' } },
        ],
      },
      deletion: [{ object: 'tag', id: 'old' }],
    })
    expect(applyCompactTransition(before, transition!)).toEqual(after)
  })

  it('represents removed optional fields explicitly', () => {
    const before = makeStore({
      account: {
        cash: row({ id: 'cash', title: 'Cash', note: 'temporary' }),
      },
    })
    const after = makeStore({
      account: { cash: row({ id: 'cash', title: 'Cash' }) },
    })

    const transition = compactCanonicalTransition(before, after)

    expect(transition).toEqual({
      upsert: {
        account: [{ id: 'cash', fields: {}, remove: ['note'] }],
      },
    })
    expect(applyCompactTransition(before, transition!)).toEqual(after)
  })

  it('returns no transition when snapshots are equal', () => {
    const snapshot = makeStore({ serverTimestamp: 10 })
    expect(compactCanonicalTransition(snapshot, snapshot)).toBeUndefined()
  })

  it('keeps a cursor-only transition distinct from entity changes', () => {
    expect(
      compactCanonicalTransition(
        makeStore({ serverTimestamp: 10 }),
        makeStore({ serverTimestamp: 11 })
      )
    ).toEqual({ serverTimestamp: 11 })
  })
})

function row<T extends { id: string | number }>(value: T) {
  return value as any
}
