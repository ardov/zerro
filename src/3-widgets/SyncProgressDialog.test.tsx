import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', async importOriginal => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) => {
      if (key === 'syncProgress:count')
        return `${values?.confirmed}\u00a0/\u00a0${values?.total}`
      return values ? `${key}:${Object.values(values).join(':')}` : key
    },
  }),
}))

import { SyncProgressDialogView } from './SyncProgressDialog'

const rows = [
  { key: 'user' as const, confirmed: 1, total: 1 },
  { key: 'transaction' as const, confirmed: 700, total: 1000 },
]

describe('SyncProgressDialog', () => {
  it('shows active progress and can be dismissed without stopping it', async () => {
    const onClose = vi.fn()
    const onContinue = vi.fn()
    render(
      <SyncProgressDialogView
        open
        progress={{
          kind: 'pushing',
          phase: 'sending',
          rows,
          errorMessage: null,
          errorStatus: null,
          retryAt: null,
        }}
        onClose={onClose}
        onRetry={vi.fn()}
        onContinue={onContinue}
      />
    )

    expect(
      screen.getByRole('progressbar', { name: 'settings:entity_userSettings' })
    ).toHaveAttribute('aria-valuenow', '1')
    expect(
      screen.getByRole('progressbar', { name: 'settings:entity_transaction' })
    ).toHaveAttribute('aria-valuenow', '700')
    expect(screen.getByText('700 / 1000')).toBeInTheDocument()
    expect(
      screen
        .getByRole('progressbar', { name: 'settings:entity_transaction' })
        .querySelector('.radial-progress-activity')
    ).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('offers retry and continue-later after a stop, with a readable reason', async () => {
    const onRetry = vi.fn()
    const onContinue = vi.fn()
    render(
      <SyncProgressDialogView
        open
        progress={{
          kind: 'stopped',
          rows,
          errorMessage: 'Unparsable diff response (HTTP 504)',
          errorStatus: 504,
          maxBytes: 1024,
        }}
        onClose={vi.fn()}
        onRetry={onRetry}
        onContinue={onContinue}
      />
    )

    expect(
      screen.getByText(/syncProgress:gatewayTimeoutError/)
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/Unparsable diff response/)
    ).not.toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'syncProgress:retryNow' })
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'syncProgress:continueLater' })
    )
    expect(onRetry).toHaveBeenCalledOnce()
    expect(onContinue).toHaveBeenCalledOnce()
  })
})
