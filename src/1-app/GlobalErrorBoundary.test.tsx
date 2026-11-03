import '@testing-library/jest-dom'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { captureError } from '@/6-shared/diagnostics'

const { clearPersistedLocalDataMock, tokenClearMock } = vi.hoisted(() => ({
  clearPersistedLocalDataMock: vi.fn(),
  tokenClearMock: vi.fn(),
}))

vi.mock('@/store/data', () => ({
  clearPersistedLocalData: clearPersistedLocalDataMock,
}))
vi.mock('@/6-shared/diagnostics', () => ({ captureError: vi.fn() }))
vi.mock('@/6-shared/api/tokenStorage', () => ({
  tokenStorage: { clear: tokenClearMock },
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import GlobalErrorBoundary from './GlobalErrorBoundary'

function BrokenChild(): never {
  throw new Error('render failed')
}

describe('GlobalErrorBoundary', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('shows and reports chunk failures when a reload marker cannot be persisted', () => {
    vi.stubGlobal('sessionStorage', null)
    const reload = vi
      .spyOn(window.location, 'reload')
      .mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const error = new Error('Failed to fetch dynamically imported module')
    function BrokenChunk(): never {
      throw error
    }
    render(
      <GlobalErrorBoundary>
        <BrokenChunk />
      </GlobalErrorBoundary>
    )
    expect(screen.getByRole('button', { name: 'btnFix' })).toBeVisible()
    expect(reload).not.toHaveBeenCalled()
    expect(captureError).toHaveBeenCalledWith(error, expect.any(Object))
  })

  it('can reload from the fallback when localStorage is unavailable', async () => {
    vi.stubGlobal('localStorage', null)
    clearPersistedLocalDataMock.mockResolvedValueOnce(undefined)
    const reload = vi
      .spyOn(window.location, 'reload')
      .mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(
      <GlobalErrorBoundary>
        <BrokenChild />
      </GlobalErrorBoundary>
    )
    fireEvent.click(screen.getByRole('button', { name: 'btnFix' }))
    await waitFor(() => expect(reload).toHaveBeenCalledOnce())
    expect(tokenClearMock).toHaveBeenCalledOnce()
  })

  it('waits for queued replica cleanup before reloading', async () => {
    let finishCleanup!: () => void
    clearPersistedLocalDataMock.mockReturnValueOnce(
      new Promise<void>(resolve => {
        finishCleanup = resolve
      })
    )
    const reload = vi
      .spyOn(window.location, 'reload')
      .mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <GlobalErrorBoundary>
        <BrokenChild />
      </GlobalErrorBoundary>
    )
    fireEvent.click(screen.getByRole('button', { name: 'btnFix' }))

    expect(clearPersistedLocalDataMock).toHaveBeenCalledOnce()
    expect(reload).not.toHaveBeenCalled()

    finishCleanup()
    await waitFor(() => expect(reload).toHaveBeenCalledOnce())
    expect(tokenClearMock).toHaveBeenCalledOnce()
  })
})
