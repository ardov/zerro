import '@testing-library/jest-dom'
import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { expect, it, vi } from 'vitest'

import { rootReducer } from '@/store/rootReducer'
import { syncStatusChanged } from '@/store/sync'
import { SyncProgressDialog } from './SyncProgressDialog'

vi.mock('react-i18next', async importOriginal => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))

import RefreshButton from './RefreshButton'

it('opens and dismisses details while the push continues', async () => {
  const store = configureStore({ reducer: rootReducer })
  store.dispatch(
    syncStatusChanged({
      status: {
        kind: 'pushing',
        phase: 'sending',
        rows: [{ key: 'transaction', confirmed: 23, total: 100 }],
        errorMessage: null,
        errorStatus: null,
        retryAt: null,
      },
    })
  )
  render(
    <Provider store={store}>
      <RefreshButton />
      <SyncProgressDialog />
    </Provider>
  )

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await userEvent.click(
    screen.getByRole('button', { name: 'syncProgress:detailsTitle' })
  )
  expect(await screen.findByRole('dialog')).toBeVisible()
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(store.getState().sync.status).toMatchObject({
    kind: 'pushing',
    phase: 'sending',
  })
})
