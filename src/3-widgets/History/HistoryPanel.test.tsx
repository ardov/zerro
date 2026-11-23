import '@testing-library/jest-dom'
import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCheckpointEntry } from '@/zerro-core/replica'
import {
  makeAccount,
  makeStore,
} from '@/zerro-core/support/testing/zenmoneyTestData'
import { OverlayHost } from '@/6-shared/overlays'
import { rootReducer } from '@/store/rootReducer'
import { makeTestRootState } from '@/store/testing'
import { HistoryPanel, historyPanelScreen } from './HistoryPanel'

const { listHistory } = vi.hoisted(() => ({ listHistory: vi.fn() }))
vi.mock('@/6-shared/api/replicaStorage', () => ({
  replicaStorage: { listHistory },
}))
vi.mock('react-i18next', async importOriginal => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))

afterEach(() => vi.restoreAllMocks())

function OpenHistory() {
  const open = historyPanelScreen.useOpen()
  return <button onClick={() => open(true)}>open history</button>
}

describe('history panel', () => {
  it('loads and shows saved history when the drawer opens', async () => {
    const base = makeStore({ account: { cash: makeAccount({ id: 'cash' }) } })
    listHistory.mockResolvedValue({
      entries: [createCheckpointEntry(7, 1, 'full-sync', base)],
    })
    const store = configureStore({
      reducer: rootReducer,
      preloadedState: makeTestRootState(base),
    })
    render(
      <Provider store={store}>
        <MemoryRouter>
          <OverlayHost>
            <OpenHistory />
            <HistoryPanel />
          </OverlayHost>
        </MemoryRouter>
      </Provider>
    )

    expect(screen.queryByText('panelTitle')).not.toBeInTheDocument()
    expect(listHistory).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'open history' }))

    expect(screen.getByText('panelTitle')).toBeInTheDocument()
    expect(await screen.findByText('checkpoint')).toBeVisible()
  })
})
