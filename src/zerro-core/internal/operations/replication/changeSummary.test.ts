import { describe, expect, it } from 'vitest'
import {
  makeAccount,
  makeStore,
  makeTransaction,
} from '../../../support/testing/zenmoneyTestData'
import { compactCanonicalTransition } from './journal'
import {
  isEmptyChangeSummary,
  summarizeCanonicalTransition,
  summarizeNormalizedPatch,
} from './changeSummary'

describe('change summary', () => {
  it('counts what a canonical point touched, per entity type', () => {
    const before = makeStore({
      serverTimestamp: 10,
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
      transaction: {
        old: makeTransaction({ id: 'old' }),
        kept: makeTransaction({ id: 'kept', comment: 'before' }),
      },
    })
    const after = makeStore({
      serverTimestamp: 20,
      account: {
        cash: makeAccount({ id: 'cash', title: 'Wallet' }),
        card: makeAccount({ id: 'card' }),
      },
      transaction: {
        kept: makeTransaction({ id: 'kept', comment: 'after' }),
      },
    })

    const transition = compactCanonicalTransition(before, after)
    expect(transition).toBeDefined()

    expect(summarizeCanonicalTransition(transition!)).toEqual({
      account: { changed: 2, removed: 0 },
      transaction: { changed: 1, removed: 1 },
    })
  })

  it('reads a soft delete as a removal rather than an edit', () => {
    const before = makeStore({
      serverTimestamp: 10,
      transaction: { one: makeTransaction({ id: 'one' }) },
    })
    const after = makeStore({
      serverTimestamp: 20,
      transaction: { one: makeTransaction({ id: 'one', deleted: true }) },
    })

    const transition = compactCanonicalTransition(before, after)

    // The row is still in the store: counting it as changed would hide the
    // one operation a user looking through history is most likely after.
    expect(summarizeCanonicalTransition(transition!)).toEqual({
      transaction: { changed: 0, removed: 1 },
    })
  })

  it('counts a materialized patch the same way', () => {
    const summary = summarizeNormalizedPatch({
      account: [makeAccount({ id: 'cash' })],
      transaction: [
        makeTransaction({ id: 'one' }),
        makeTransaction({ id: 'two', deleted: true }),
      ],
      deletion: [{ id: 'gone', object: 'reminder', stamp: 1, user: 1 }],
    })

    expect(summary).toEqual({
      account: { changed: 1, removed: 0 },
      transaction: { changed: 1, removed: 1 },
      reminder: { changed: 0, removed: 1 },
    })
  })

  it('reports nothing for a transition that only moved the clock', () => {
    const summary = summarizeCanonicalTransition({ serverTimestamp: 20 })

    expect(summary).toEqual({})
    expect(isEmptyChangeSummary(summary)).toBe(true)
  })
})
