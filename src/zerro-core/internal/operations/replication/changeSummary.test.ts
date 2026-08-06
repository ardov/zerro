import { describe, expect, it } from 'vitest'
import {
  makeAccount,
  makeReminder,
  makeStore,
  makeTransaction,
} from '../../../support/testing/zenmoneyTestData'
import { HiddenDataType } from '../../domain/zerro/hidden-data'
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

  it('reports what a hidden-data reminder carries, not that it is a reminder', () => {
    const hidden = (type: HiddenDataType, month: string, payload: object) =>
      makeReminder({
        id: `${type}-${month}`,
        comment: JSON.stringify({ type, month, payload }),
      })
    const before = makeStore({
      serverTimestamp: 10,
      reminder: {
        'budgets-2026-08': hidden(HiddenDataType.Budgets, '2026-08', {}),
      },
    })
    const after = makeStore({
      serverTimestamp: 20,
      reminder: {
        'budgets-2026-08': hidden(HiddenDataType.Budgets, '2026-08', {
          'tag#food': 5000,
        }),
        'goals-2026-08': hidden(HiddenDataType.Goals, '2026-08', {
          'tag#car': { type: 'monthly', amount: 1000 },
        }),
        plain: makeReminder({ id: 'plain', comment: 'Pay the rent' }),
      },
    })

    const transition = compactCanonicalTransition(before, after)

    // Budgets and goals are Zerro's own state; only the third row is the
    // ZenMoney concept a user would call a reminder.
    expect(summarizeCanonicalTransition(transition!)).toEqual({
      'envelope-budget': { changed: 1, removed: 0 },
      goal: { changed: 1, removed: 0 },
      reminder: { changed: 1, removed: 0 },
    })
  })

  it('falls back to the reminder when the payload cannot be read', () => {
    const summary = summarizeNormalizedPatch({
      reminder: [
        makeReminder({ id: 'broken', comment: '{"type":"budgets","payload":' }),
        makeReminder({ id: 'foreign', comment: '{"type":"somethingElse"}' }),
      ],
    })

    // A comment this code cannot read is still a reminder that changed;
    // history must not be the thing that breaks on unfamiliar data.
    expect(summary).toEqual({ reminder: { changed: 2, removed: 0 } })
  })

  it('reports nothing for a transition that only moved the clock', () => {
    const summary = summarizeCanonicalTransition({ serverTimestamp: 20 })

    expect(summary).toEqual({})
    expect(isEmptyChangeSummary(summary)).toBe(true)
  })
})
