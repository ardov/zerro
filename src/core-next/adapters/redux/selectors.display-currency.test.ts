import { describe, expect, it } from 'vitest'
import type { RootState } from 'store'
import { makeDemoStore } from '../../demo'
import {
  selectCoreDisplayConverter,
  selectCoreDisplayCurrency,
} from './selectors'

const NOW = Date.parse('2026-07-11T12:00:00Z')

function makeState(displayCurrency: RootState['displayCurrency']): RootState {
  const current = makeDemoStore({ now: NOW })
  return {
    data: { current, base: current, outbox: [], outboxHead: 0 },
    displayCurrency,
    isPending: false,
    lastSync: { finishedAt: 0, isSuccessful: null, errorMessage: null },
    token: null,
  }
}

describe('Core display currency selectors', () => {
  it('prefers the saved display currency and binds it to the FX converter', () => {
    const state = makeState('EUR')
    const convert = selectCoreDisplayConverter(state)

    expect(selectCoreDisplayCurrency(state)).toBe('EUR')
    expect(convert({ EUR: 25 }, 'current')).toBe(25)
  })

  it('falls back to the root user currency', () => {
    const state = makeState(null)
    const userCurrency = Object.values(state.data.current.user)[0].currency
    const instrument = state.data.current.instrument[userCurrency]

    expect(selectCoreDisplayCurrency(state)).toBe(instrument.shortTitle)
  })
})
