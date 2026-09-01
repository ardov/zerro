import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { rootReducer } from 'store/rootReducer'

const { dispatchMock, state } = vi.hoisted(() => ({
  dispatchMock: vi.fn(),
  state: { current: null as unknown },
}))

vi.mock('store', () => ({
  useAppDispatch: () => dispatchMock,
  useAppSelector: (selector: (root: unknown) => unknown) =>
    selector(state.current),
}))
vi.mock('3-widgets/RegularSyncHandler', () => ({
  useRegularSync: () => [true],
}))
vi.mock('react-i18next', async importOriginal => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))

import RefreshButton from './RefreshButton'

describe('RefreshButton', () => {
  beforeEach(() => {
    dispatchMock.mockReset()
    state.current = {
      ...rootReducer(undefined, { type: 'test' }),
      sync: {
        status: {
          kind: 'pushing',
          phase: 'sending',
          rows: [{ key: 'transaction', confirmed: 23, total: 100 }],
          errorMessage: null,
          errorStatus: null,
          retryAt: null,
        },
        lastResult: null,
        detailsOpen: false,
      },
    }
  })

  it('opens details instead of starting another push while syncing', async () => {
    render(<RefreshButton isMobile />)

    const button = screen.getByRole('button', {
      name: 'syncProgress:detailsTitle',
    })
    expect(button.querySelector('.radial-progress-activity')).toBeVisible()

    await userEvent.click(button)

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'sync/syncDetailsOpened',
    })
  })
})
