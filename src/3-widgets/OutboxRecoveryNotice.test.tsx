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

vi.mock('4-features/localData', () => ({
  discardCorruptOutbox: () => ({ type: 'outbox/discard' }),
}))

import { OutboxRecoveryNotice } from './OutboxRecoveryNotice'

function createStore(reason: string | null) {
  const data = dataReducer(undefined, { type: 'test/init' })
  return configureStore({
    reducer: { data: dataReducer },
    preloadedState: { data: { ...data, outboxRecoveryReason: reason } },
  })
}

describe('OutboxRecoveryNotice', () => {
  it('stays hidden while the durable outbox is valid', () => {
    render(
      <Provider store={createStore(null)}>
        <OutboxRecoveryNotice />
      </Provider>
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('requires confirmation before discarding corrupt local commands', async () => {
    render(
      <Provider store={createStore('outbox[0] is invalid')}>
        <OutboxRecoveryNotice />
      </Provider>
    )

    expect(screen.getByRole('alert')).toHaveTextContent('outboxRecoveryTitle')
    expect(screen.getByRole('alert')).toHaveTextContent('outbox[0] is invalid')
    await userEvent.click(
      screen.getByRole('button', { name: 'outboxRecoveryConfirm' })
    )
    expect(confirmMock).toHaveBeenCalledOnce()
  })
})
