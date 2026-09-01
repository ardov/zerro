import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TNormalizedPatch } from '@/6-shared/types'
import { convertDiff } from '@/6-shared/api/zm-adapter'
import { makeTestRootState } from '@/store/testing'
import {
  makeAccount,
  makeInstrument,
  makeMerchant,
  makeStore,
  makeUser,
} from '@/zerro-core/support/testing/zenmoneyTestData'
import { AccountType } from '@/zerro-core/internal/domain/zenmoney'
import { ActionList } from '@/6-shared/ui/ActionList'

import { ImportBackupItem } from './ImportBackupItem'

const { askMock, answerMock, askedOverlay, dispatchMock, snackbarMock } =
  vi.hoisted(() => ({
    askMock: vi.fn(),
    answerMock: vi.fn(),
    askedOverlay: {
      element: null as unknown,
      resolve: undefined as ((value?: boolean) => void) | undefined,
    },
    dispatchMock: vi.fn(),
    snackbarMock: vi.fn(),
  }))

vi.mock('@/store', () => ({ useAppDispatch: () => dispatchMock }))
vi.mock('@/6-shared/ui/SnackbarProvider', () => ({
  useSnackbar: () => snackbarMock,
}))
vi.mock('@/6-shared/overlays', () => ({
  useAsk: () => askMock,
  useAsked: () => ({ open: true, answer: answerMock }),
}))
vi.mock('@/6-shared/analytics', () => ({ track: vi.fn() }))
vi.mock('@/4-features/localData', () => ({ clearLocalData: vi.fn() }))
vi.mock('react-i18next', async importOriginal => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values?.path ? `${key}:${values.path}:${values.count}` : key,
  }),
}))

function makeSnapshot(title: string) {
  return makeStore({
    instrument: {
      1: makeInstrument({ id: 1 }),
      2: makeInstrument({ id: 2 }),
    },
    country: {
      1: { id: 1, title: 'United States', currency: 1, domain: 'us' },
    },
    user: {
      1: makeUser({ id: 1, parent: null, currency: 2 }),
    },
    account: {
      debt: makeAccount({
        id: 'debt',
        type: AccountType.Debt,
        title: 'Debt',
      }),
      cash: makeAccount({ id: 'cash', title }),
    },
    merchant: {
      shop: makeMerchant({ id: 'shop', title: 'Shop' }),
    },
  })
}

/** A valid backup carrying one field this version has no meaning for. */
function toWarnedBackup(title: string): string {
  const store = makeSnapshot(title)
  const patch: TNormalizedPatch = { serverTimestamp: store.serverTimestamp }
  const target = patch as Record<string, unknown>
  Object.entries(store).forEach(([key, value]) => {
    if (key !== 'serverTimestamp') target[key] = Object.values(value as object)
  })
  const wire = convertDiff.toServer(patch) as Record<string, unknown>
  const merchant = wire.merchant as Array<Record<string, unknown>>
  merchant[0].futureField = true
  return JSON.stringify(wire)
}

describe('ImportBackupItem', () => {
  beforeEach(() => {
    const state = makeTestRootState(makeSnapshot('Current cash'))
    dispatchMock.mockReset()
    dispatchMock.mockImplementation(action =>
      typeof action === 'function'
        ? action(dispatchMock, () => state, undefined)
        : action
    )
    snackbarMock.mockReset()
    askMock.mockReset()
    answerMock.mockReset()
    askedOverlay.element = null
    askedOverlay.resolve = undefined
    askMock.mockImplementation(
      (element: ReactElement) =>
        new Promise<boolean | undefined>(resolve => {
          askedOverlay.element = element
          askedOverlay.resolve = resolve
        })
    )
    answerMock.mockImplementation((value?: boolean) =>
      askedOverlay.resolve?.(value)
    )
  })

  it('offers an explicit restore-anyway action for a valid warned backup', async () => {
    const onClose = vi.fn()
    const view = render(
      <ActionList>
        <ImportBackupItem onClose={onClose} />
      </ActionList>
    )
    const input = view.container.querySelector('input[type="file"]')
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('file input was not rendered')
    }
    const file = new File([toWarnedBackup('Current cash')], 'backup.json', {
      type: 'application/json',
    })

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(askMock).toHaveBeenCalledOnce())
    expect(onClose).toHaveBeenCalledOnce()
    render(askedOverlay.element as ReactElement)

    expect(
      await screen.findByText(
        'importCompatibilityWarningItem:merchant.futureField:1'
      )
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'importConfirmAnyway' })
    ).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'importConfirm' })
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'importConfirmAnyway' }))
    await waitFor(() =>
      expect(snackbarMock).toHaveBeenCalledWith({ message: 'importNoChanges' })
    )
  })
})
