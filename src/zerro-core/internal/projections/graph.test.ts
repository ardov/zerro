import { describe, expect, it, vi } from 'vitest'
import {
  makeInstrument,
  makeStore,
  makeUser,
} from '../../support/testing/zenmoneyTestData'
import { getInstCodeMap } from '../domain/zenmoney/entities/instruments'
import { createProjectionGraph } from './graph'

vi.mock('../domain/zenmoney/entities/instruments', async importOriginal => {
  const actual =
    await importOriginal<
      typeof import('../domain/zenmoney/entities/instruments')
    >()
  return { ...actual, getInstCodeMap: vi.fn(actual.getInstCodeMap) }
})

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

  it('reuses the instrument code map until the instruments change', () => {
    const graph = createProjectionGraph(ctx)
    const store = makeStore({
      instrument: instruments,
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
    })
    vi.mocked(getInstCodeMap).mockClear()

    for (let i = 0; i < 20; i++) graph.userCurrency(store)
    // Unrelated slices change, the instrument map keeps its reference.
    graph.userCurrency({ ...store, transaction: {}, reminderMarker: {} })
    expect(getInstCodeMap).toHaveBeenCalledTimes(1)

    const renamed = {
      ...store,
      instrument: {
        ...instruments,
        2: makeInstrument({ id: 2, shortTitle: 'EURO' }),
      },
    }
    expect(graph.userCurrency(renamed)).toBe('EURO')
    expect(getInstCodeMap).toHaveBeenCalledTimes(2)
  })
})
