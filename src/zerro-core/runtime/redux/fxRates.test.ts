import { configureStore } from '@reduxjs/toolkit'
import { describe, expect, it } from 'vitest'
import { rootReducer } from '@/store/rootReducer'
import { makeTestRootState } from '@/store/testing'
import { parseCommandOutbox, replayOutbox } from '../../replica'
import {
  makeAccount,
  makeInstrument,
  makeReminder,
  makeStore,
  makeUser,
} from '../../support/testing/zenmoneyTestData'
import { selectGetter, setQuote } from './fxRates'
import type { TISOMonth } from '../../internal/domain/foundation/primitives'

const month = '2025-06'

function savedRates(
  id: string,
  date: TISOMonth,
  rates: Record<string, number>
) {
  return makeReminder(id, {
    type: 'fxRates',
    month: date,
    payload: { date, changed: 1, rates },
  })
}

function setup(reminder: ReturnType<typeof makeStore>['reminder']) {
  const data = makeStore({
    reminder,
    user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
    account: { data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }) },
    instrument: {
      1: makeInstrument({ id: 1, shortTitle: 'USD', rate: 80 }),
      2: makeInstrument({
        id: 2,
        shortTitle: 'SOL',
        symbol: 'μSOL',
        rate: 0.008,
      }),
      3: makeInstrument({ id: 3, shortTitle: 'EUR', rate: 96 }),
    },
  })
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: makeTestRootState(data),
  })
  store.dispatch(
    setQuote({ month, code: 'SOL', quoteCode: 'USD', quotePerUnit: 0.00015 })
  )
  const outbox = parseCommandOutbox(
    JSON.parse(JSON.stringify(store.getState().data.outbox))
  )
  return { data, outbox }
}

describe('manually quoted monthly rates', () => {
  it.each([false, true])(
    'keeps the quoted price after live USD moves (existing partial month: %s)',
    partial => {
      const { data, outbox } = setup(
        partial ? { doc: savedRates('doc', month, { EUR: 72 }) } : {}
      )
      const updatedInstruments = {
        ...data.instrument,
        1: { ...data.instrument[1], rate: 100 },
        3: { ...data.instrument[3], rate: 120 },
      }
      const accepted = replayOutbox(data, outbox)
      const afterSync = { ...accepted, instrument: updatedInstruments }
      const stillPending = replayOutbox(
        { ...data, instrument: updatedInstruments },
        outbox
      )
      for (const snapshot of [afterSync, stillPending]) {
        const { rates } = selectGetter(makeTestRootState(snapshot))(month)
        expect((rates.SOL * 1_000_000) / rates.USD).toBeCloseTo(150, 10)
        expect(rates.USD).toBe(80)
        expect(rates.EUR).toBe(partial ? 72 : 96)
      }
    }
  )

  it.each([75, undefined])(
    'preserves a concurrent EUR edit when replaying against a remote month (saved USD: %s)',
    remoteUsd => {
      const { data, outbox } = setup({
        prev: savedRates('prev', '2025-05', { USD: 1, EUR: 1.1, SOL: 0.0001 }),
      })
      const remote = {
        ...data,
        reminder: {
          ...data.reminder,
          other: savedRates(
            'other',
            month,
            remoteUsd === undefined ? { EUR: 90 } : { USD: remoteUsd, EUR: 90 }
          ),
        },
      }
      const rebased = replayOutbox(remote, outbox)
      const { rates } = selectGetter(makeTestRootState(rebased))(month)
      expect(rates.EUR).toBe(90)
      expect(rates.USD).toBe(remoteUsd ?? 80)
      expect((rates.SOL * 1_000_000) / rates.USD).toBeCloseTo(150, 10)
    }
  )
})
