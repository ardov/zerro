import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RootState } from '@/store'

const { selectInstrumentsMock, editFxRatesMock, selectCurrentMock } =
  vi.hoisted(() => ({
    selectInstrumentsMock: vi.fn(),
    editFxRatesMock: vi.fn(),
    selectCurrentMock: vi.fn(),
  }))

vi.mock('@/zerro-core/redux', () => ({
  core: {
    instruments: { selectAll: selectInstrumentsMock },
    fxRates: {
      edit: editFxRatesMock,
      selectCurrent: selectCurrentMock,
    },
  },
}))

import { canFetchFxRates, loadFxRates } from './fxRates'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('FX rate loading', () => {
  it('saves historical USD prices per Zenmoney instrument unit', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-11T12:00:00Z'))
    selectInstrumentsMock.mockReturnValue({
      1: { shortTitle: 'USD', symbol: '$' },
      2: { shortTitle: 'SOL', symbol: 'μSOL' },
      3: { shortTitle: 'DASH', symbol: 'µDASH' },
      4: { shortTitle: 'BTC', symbol: 'μBTC' },
    })
    const fetch = vi.fn().mockResolvedValue(
      Response.json({
        usd: { usd: 1, sol: 0.0075, dash: 0.025, btc: 0.00001, extra: 2 },
      })
    )
    vi.stubGlobal('fetch', fetch)
    const action = { type: 'fx/edit' }
    editFxRatesMock.mockReturnValue(action)
    const dispatch = vi.fn()

    await loadFxRates('2026-06')(dispatch, () => ({}) as RootState, undefined)

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('2026-06-28'))
    expect(editFxRatesMock).toHaveBeenCalledWith('2026-06', {
      USD: 1,
      SOL: 0.000133333333,
      DASH: 0.00004,
      BTC: 0.1,
    })
    expect(dispatch).toHaveBeenCalledWith(action)
    expect(canFetchFxRates('2026-06')).toBe(true)
  })

  it('freezes current rates without a network request', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-11T12:00:00Z'))
    const state = {} as RootState
    const rates = { USD: 1, EUR: 0.9 }
    selectCurrentMock.mockReturnValue({ rates })
    editFxRatesMock.mockReturnValue({ type: 'fx/edit' })

    await loadFxRates('2026-07')(vi.fn(), () => state, undefined)

    expect(selectCurrentMock).toHaveBeenCalledWith(state)
    expect(editFxRatesMock).toHaveBeenCalledWith('2026-07', rates)
    expect(fetch).not.toHaveBeenCalled()
  })
})
