import { materializeTestInput } from '@/zerro-core/support/testing/commandTestData'
import { describe, expect, it } from 'vitest'
import {
  makeAccount,
  makeStore,
  makeUser,
} from '../../../../support/testing/zenmoneyTestData'
import { applyPatch } from '../../zenmoney'
import { getStoredFxRates } from './read'
import { compileResetFxRates, compileSetFxRates } from './commands'

const ctx = { now: () => 100, uuid: () => 'fx-rates-reminder' }

describe('FX rate commands', () => {
  it('sets complete monthly rates and resets them', () => {
    const data = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 2 }) },
      account: {
        data: makeAccount({ id: 'data', title: '🤖 [Zerro Data]' }),
      },
    })
    const rates = { USD: 1, EUR: 0.9 }
    const setPatch = materializeTestInput(
      data,
      compileSetFxRates(data, '2026-06', rates, ctx)
    )
    const withRates = applyPatch(data, setPatch)

    expect(getStoredFxRates(withRates.reminder)['2026-06']).toEqual({
      date: '2026-06',
      changed: 100,
      rates,
    })

    const resetPatch = materializeTestInput(
      withRates,
      compileResetFxRates(withRates, '2026-06', ctx)
    )
    expect(
      getStoredFxRates(applyPatch(withRates, resetPatch).reminder)
    ).toEqual({})
  })
})
