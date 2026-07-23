import { describe, expect, it } from 'vitest'
import type { RootState } from 'store'
import { makeDemoStore } from '../../support/demo'
import { makeTestRootState } from 'store/testing'
import {
  selectDisplayConverter,
  selectDisplayCurrency,
} from '../../support/testing/reduxSelectors'

const NOW = Date.parse('2026-07-11T12:00:00Z')

function makeState(displayCurrency: RootState['displayCurrency']): RootState {
  return makeTestRootState(makeDemoStore({ now: NOW }), { displayCurrency })
}

describe('Core display currency selectors', () => {
  it('prefers the saved display currency and binds it to the FX converter', () => {
    const state = makeState('EUR')
    const convert = selectDisplayConverter(state)

    expect(selectDisplayCurrency(state)).toBe('EUR')
    expect(convert({ EUR: 25 }, 'current')).toBe(25)
  })

  it('falls back to the root user currency', () => {
    const state = makeState(null)
    const userCurrency = Object.values(state.data.current.user)[0].currency
    const instrument = state.data.current.instrument[userCurrency]

    expect(selectDisplayCurrency(state)).toBe(instrument.shortTitle)
  })
})
