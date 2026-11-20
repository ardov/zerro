import { describe, expect, it, vi } from 'vitest'
import {
  makeAccount,
  makeInstrument,
  makeReminder,
  makeStore,
  makeTag,
  makeTransaction,
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

describe('budget exchange rates', () => {
  // Food is covered at 80 RUB per USD, then the live USD quote moves to 90.
  const withUsdQuote = (rate: number, savedRates: boolean) =>
    makeStore({
      instrument: {
        1: makeInstrument({ id: 1, shortTitle: 'RUB', rate: 1 }),
        2: makeInstrument({ id: 2, shortTitle: 'USD', rate }),
      },
      user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
      tag: { food: makeTag({ id: 'food', title: 'Food' }) },
      account: {
        usd: makeAccount({ id: 'usd', instrument: 2, inBalance: true }),
      },
      transaction: {
        lunch: makeTransaction({
          id: 'lunch',
          date: '2026-05-10',
          tag: ['food'],
          outcome: 10,
          outcomeInstrument: 2,
          outcomeAccount: 'usd',
          incomeInstrument: 2,
          incomeAccount: 'usd',
        }),
      },
      reminder: {
        budgets: makeReminder('budgets', {
          type: 'budgets',
          month: '2026-05',
          payload: { 'tag#food': 800 },
        }),
        ...(savedRates && {
          rates: makeReminder('rates', {
            type: 'fxRates',
            month: '2026-04',
            payload: {
              date: '2026-04',
              changed: 1,
              rates: { RUB: 1, USD: 80 },
            },
          }),
        }),
      },
    })

  it('keep a covered envelope in place once a table is saved', () => {
    const graph = createProjectionGraph(ctx)
    const food = (rate: number, savedRates: boolean) =>
      graph.envMetrics(withUsdQuote(rate, savedRates))['2026-05']['tag#food']
        .selfAvailable.RUB

    expect(food(80, true)).toBe(0)
    expect(food(90, true)).toBe(0)
    // Resetting the only table returns the month to live quotes.
    expect(food(90, false)).toBe(-100)
    expect(food(80, false)).toBe(0)
  })
})
