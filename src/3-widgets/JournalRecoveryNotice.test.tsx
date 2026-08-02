import '@testing-library/jest-dom'
import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { describe, expect, it, vi } from 'vitest'
import dataReducer from 'store/data'

const { confirmMock } = vi.hoisted(() => ({
  confirmMock: vi.fn(),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('6-shared/ui/SmartConfirm', () => ({
  useConfirm: () => confirmMock,
}))

vi.mock('4-features/sync', () => ({
  reloadData: () => ({ type: 'journal/reload' }),
}))

import { JournalRecoveryNotice } from './JournalRecoveryNotice'

function createStore(recoveryRequired: boolean) {
  const data = dataReducer(undefined, { type: 'test/init' })
  return configureStore({
    reducer: { data: dataReducer },
    preloadedState: {
      data: {
        ...data,
        journalRecoveryRequired: recoveryRequired,
        journalRecoveryReason: recoveryRequired ? 'broken graph' : null,
      },
    },
  })
}

describe('JournalRecoveryNotice', () => {
  it('stays hidden when the accepted branch is valid', () => {
    const store = createStore(false)

    render(
      <Provider store={store}>
        <JournalRecoveryNotice />
      </Provider>
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('offers a confirmed full reload when recovery is required', async () => {
    const store = createStore(true)

    render(
      <Provider store={store}>
        <JournalRecoveryNotice />
      </Provider>
    )

    expect(screen.getByRole('alert')).toHaveTextContent('journalRecoveryTitle')
    expect(screen.getByRole('alert')).toHaveTextContent('broken graph')
    await userEvent.click(
      screen.getByRole('button', { name: 'journalRecoveryConfirm' })
    )
    expect(confirmMock).toHaveBeenCalledOnce()
  })
})
