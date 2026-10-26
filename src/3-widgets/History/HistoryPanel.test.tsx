import '@testing-library/jest-dom'
import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as replica from '@/zerro-core/replica'
import { testOperations } from '@/zerro-core/support/testing/commandTestData'
import {
  makeAccount,
  makeStore,
} from '@/zerro-core/support/testing/zenmoneyTestData'
import { OverlayHost } from '@/6-shared/overlays'
import { appendClientCommand } from '@/store/data'
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
  it('reads history and builds row summaries only while open', async () => {
    listHistory.mockResolvedValue({ entries: [] })
    const summarize = vi.spyOn(replica, 'getMaterializedOutboxPatches')
    const store = configureStore({
      reducer: rootReducer,
      preloadedState: makeTestRootState(
        makeStore({ account: { cash: makeAccount({ id: 'cash' }) } })
      ),
    })
    store.dispatch(
      appendClientCommand({
        issuedAt: 10,
        operations: testOperations({
          account: [makeAccount({ id: 'cash', title: 'Wallet' })],
        }),
      })
    )
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
    expect(summarize).not.toHaveBeenCalled()
    expect(listHistory).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'open history' }))

    expect(screen.getByText('panelTitle')).toBeInTheDocument()
    expect(summarize).toHaveBeenCalled()
    await waitFor(() => expect(listHistory).toHaveBeenCalledOnce())
  })
})
