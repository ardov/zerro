import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const { clearPersistedLocalDataMock, tokenClearMock } = vi.hoisted(() => ({
  clearPersistedLocalDataMock: vi.fn(),
  tokenClearMock: vi.fn(),
}))

vi.mock('store/data', () => ({
  clearPersistedLocalData: clearPersistedLocalDataMock,
}))
vi.mock('6-shared/diagnostics', () => ({ captureError: vi.fn() }))
vi.mock('6-shared/api/tokenStorage', () => ({
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
