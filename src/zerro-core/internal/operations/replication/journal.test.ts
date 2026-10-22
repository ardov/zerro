import { describe, expect, it } from 'vitest'
import { makeStore } from '../../../support/testing/zenmoneyTestData'
import { applyCompactTransitions, compactCanonicalTransition } from './journal'

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
    expect(applyCompactTransitions(before, [transition!])).toEqual(after)
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
    expect(applyCompactTransitions(before, [transition!])).toEqual(after)
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

describe('a run of canonical transitions', () => {
  const states = [
    makeStore({
      serverTimestamp: 10,
      account: {
        cash: row({ id: 'cash', title: 'Cash', note: 'temporary' }),
        card: row({ id: 'card', title: 'Card' }),
      },
      tag: { food: row({ id: 'food', title: 'Food' }) },
      instrument: { 1: row({ id: 1, shortTitle: 'USD' }) },
    }),
    makeStore({
      serverTimestamp: 20,
      account: {
        cash: row({ id: 'cash', title: 'Wallet' }),
        card: row({ id: 'card', title: 'Card' }),
      },
      tag: { food: row({ id: 'food', title: 'Food' }) },
      instrument: { 1: row({ id: 1, shortTitle: 'USD' }) },
    }),
    makeStore({
      serverTimestamp: 30,
      account: { cash: row({ id: 'cash', title: 'Wallet' }) },
      tag: {
        food: row({ id: 'food', title: 'Groceries' }),
        rent: row({ id: 'rent', title: 'Rent' }),
      },
      instrument: { 1: row({ id: 1, shortTitle: 'USD' }) },
    }),
    makeStore({
      serverTimestamp: 40,
      account: {
        cash: row({ id: 'cash', title: 'Wallet', note: 'back' }),
        card: row({ id: 'card', title: 'New card' }),
      },
      tag: { rent: row({ id: 'rent', title: 'Rent' }) },
      instrument: { 1: row({ id: 1, shortTitle: 'USD' }) },
    }),
  ]
  states.forEach(state => (state.instrument = states[0].instrument))
  const transitions = states
    .slice(1)
    .map((state, index) => compactCanonicalTransition(states[index], state)!)

  it('reproduces every state along the run', () => {
    transitions.forEach((_, index) => {
      expect(
        applyCompactTransitions(states[0], transitions.slice(0, index + 1))
      ).toEqual(states[index + 1])
    })
  })

  it('leaves the base untouched and keeps maps the run does not touch', () => {
    const base = states[0]
    const before = structuredClone(base)

    const replayed = applyCompactTransitions(base, transitions)

    expect(base).toEqual(before)
    expect(replayed.account).not.toBe(base.account)
    expect(replayed.instrument).toBe(base.instrument)
    expect(replayed.transaction).toBe(base.transaction)
  })

  it('returns the base itself for an empty run', () => {
    expect(applyCompactTransitions(states[0], [])).toBe(states[0])
  })
})

function row<T extends { id: string | number }>(value: T) {
  return value as any
}
