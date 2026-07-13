import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RootState } from 'store'

const { requestRatesMock, editFxRatesMock, selectCurrentMock } = vi.hoisted(
  () => ({
    requestRatesMock: vi.fn(),
    editFxRatesMock: vi.fn(),
    selectCurrentMock: vi.fn(),
  })
)

vi.mock('6-shared/api/fxRates', () => ({
  firstPossibleDate: '2024-03-10',
  requestRates: requestRatesMock,
}))
vi.mock('zerro-core/redux', () => ({
  fxRates: {
    edit: editFxRatesMock,
    selectCurrent: selectCurrentMock,
  },
}))

import { canFetchFxRates, loadFxRates } from './fxRates'

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('FX rate loading', () => {
  it('loads a historical month and dispatches the semantic edit command', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-11T12:00:00Z'))
    const rates = { USD: 1, EUR: 0.9 }
    const action = { type: 'fx/edit' }
    requestRatesMock.mockResolvedValue(rates)
    editFxRatesMock.mockReturnValue(action)
    const dispatch = vi.fn()

    await loadFxRates('2026-06')(dispatch, () => ({}) as RootState, undefined)

    expect(requestRatesMock).toHaveBeenCalledWith('2026-06-28')
    expect(editFxRatesMock).toHaveBeenCalledWith('2026-06', rates)
    expect(dispatch).toHaveBeenCalledWith(action)
    expect(canFetchFxRates('2026-06')).toBe(true)
  })

  it('freezes current rates without a network request', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-11T12:00:00Z'))
    const state = {} as RootState
    const rates = { USD: 1, EUR: 0.9 }
    selectCurrentMock.mockReturnValue({ rates })
    editFxRatesMock.mockReturnValue({ type: 'fx/edit' })

    await loadFxRates('2026-07')(vi.fn(), () => state, undefined)

    expect(selectCurrentMock).toHaveBeenCalledWith(state)
    expect(editFxRatesMock).toHaveBeenCalledWith('2026-07', rates)
    expect(requestRatesMock).not.toHaveBeenCalled()
  })
})
