import { describe, expect, it } from 'vitest'
import {
  makeInstrument,
  makeStore,
  makeTag,
  makeUser,
} from '../../support/testing/zenmoneyTestData'
import { createProjectionGraph } from './graph'

const ctx = {
  now: () => Date.parse('2026-05-15T12:00:00Z'),
  uuid: () => 'id',
}

const instruments = {
  2: makeInstrument({ id: 2, shortTitle: 'EUR' }),
  3: makeInstrument({ id: 3, shortTitle: 'CZK' }),
}

describe('user currency', () => {
  it("is the root user's instrument code, USD when it cannot be resolved", () => {
    const graph = createProjectionGraph(ctx)
    const store = makeStore({
      instrument: instruments,
      user: {
        1: makeUser({ id: 1, parent: null, currency: 3 }),
        5: makeUser({ id: 5, parent: 1, currency: 2 }),
      },
    })

    expect(graph.userCurrency(store)).toBe('CZK')
    expect(
      graph.userCurrency({
        ...store,
        user: { 1: makeUser({ id: 1, parent: null, currency: 99 }) },
      })
    ).toBe('USD')
    expect(graph.userCurrency({ ...store, user: {} })).toBe('USD')
  })
})

describe('envelope metrics', () => {
  it('keep their reference when only a tag colour or icon changes', () => {
    const graph = createProjectionGraph(ctx)
    const store = makeStore({
      instrument: instruments,
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
      tag: { food: makeTag({ id: 'food', title: 'Food', color: null }) },
    })
    const metrics = graph.envMetrics(store)
    const keeping = graph.keepingEnvelopeIds(store)

    const recoloured = {
      ...store,
      tag: {
        food: makeTag({
          id: 'food',
          title: 'Food',
          color: 0xff0000,
          icon: 'x',
        }),
      },
    }
    expect(graph.envelopes(recoloured)).not.toBe(graph.envelopes(store))
    expect(graph.envMetrics(recoloured)).toBe(metrics)
    expect(graph.keepingEnvelopeIds(recoloured)).toBe(keeping)

    const renamed = {
      ...store,
      tag: { food: makeTag({ id: 'food', title: 'Groceries', color: null }) },
    }
    expect(graph.envMetrics(renamed)).not.toBe(metrics)
  })
})
