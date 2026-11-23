import { configureStore } from '@reduxjs/toolkit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyServerPatch } from '@/store/data'
import { rootReducer } from '@/store/rootReducer'
import { makeTestRootState } from '@/store/testing'
import { core } from '@/zerro-core/redux'
import {
  makeInstrument,
  makeStore,
  makeUser,
} from '@/zerro-core/support/testing/zenmoneyTestData'
import { canFetchFxRates, loadFxRates } from './fxRates'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-07-11T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function makeRatesStore(
  instrument: ReturnType<typeof makeStore>['instrument']
) {
  return configureStore({
    reducer: rootReducer,
    preloadedState: makeTestRootState(
      makeStore({
        user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
        instrument,
      })
    ),
  })
}

describe('FX rate loading', () => {
  it('saves historical USD prices per Zenmoney instrument unit', async () => {
    const store = makeRatesStore({
      1: makeInstrument({ id: 1, shortTitle: 'USD' }),
      2: makeInstrument({ id: 2, shortTitle: 'SOL', symbol: 'μSOL' }),
      3: makeInstrument({ id: 3, shortTitle: 'DASH', symbol: 'µDASH' }),
      4: makeInstrument({ id: 4, shortTitle: 'BTC', symbol: 'μBTC' }),
    })
    const fetch = vi.fn().mockResolvedValue(
      Response.json({
        usd: { usd: 1, sol: 0.0075, dash: 0.025, btc: 0.00001, extra: 2 },
      })
    )
    vi.stubGlobal('fetch', fetch)

    expect(canFetchFxRates('2026-06')).toBe(true)
    await store.dispatch(loadFxRates('2026-06'))

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('2026-06-28'))
    const { type, rates } = core.fxRates.selectGetter(store.getState())(
      '2026-06'
    )
    expect(type).toBe('saved')
    expect(rates).toEqual({
      USD: 1,
      SOL: 0.000133333333,
      DASH: 0.00004,
      BTC: 0.1,
    })
  })

  it('freezes current rates without a network request', async () => {
    const store = makeRatesStore({
      1: makeInstrument({ id: 1, shortTitle: 'USD', rate: 1 }),
      2: makeInstrument({ id: 2, shortTitle: 'EUR', rate: 0.9 }),
    })
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)

    await store.dispatch(loadFxRates('2026-07'))

    store.dispatch(
      applyServerPatch({
        instrument: [makeInstrument({ id: 2, shortTitle: 'EUR', rate: 0.8 })],
      })
    )
    expect(fetch).not.toHaveBeenCalled()
    expect(
      core.fxRates.selectGetter(store.getState())('2026-07')
    ).toMatchObject({ type: 'saved', rates: { USD: 1, EUR: 0.9 } })
  })
})
