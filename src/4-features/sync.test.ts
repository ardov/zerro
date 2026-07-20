import { configureStore } from '@reduxjs/toolkit'
import { describe, expect, it, vi } from 'vitest'

const { syncMock } = vi.hoisted(() => ({
  syncMock: vi.fn(),
}))

vi.mock('6-shared/api/syncDiff', () => ({ sync: syncMock }))

vi.mock('6-shared/api/localStore', () => ({ saveLocalData: vi.fn() }))

vi.mock('6-shared/analytics', () => ({ track: vi.fn() }))

import { makeAccount } from 'zerro-core/support/testing/zenmoneyTestData'
import data, {
  appendClientCommand,
  applyServerPatch,
  undoClientCommand,
} from 'store/data'
import isPending from 'store/isPending'
import lastSync from 'store/lastSync'
import token from 'store/token'
import { syncData } from './sync'

describe('syncData', () => {
  it('drops the redo tail before building a failed request payload', async () => {
    syncMock.mockResolvedValueOnce({ error: 'offline' })
    const store = configureStore({
      reducer: { data, isPending, lastSync, token },
    })
    store.dispatch(
      applyServerPatch({
        serverTimestamp: 100,
        account: [makeAccount({ id: 'cash', title: 'Cash' })],
      }) as any
    )
    const first = {
      type: 'patch' as const,
      patch: {
        account: [makeAccount({ id: 'cash', title: 'Wallet' })],
      },
      issuedAt: 10,
    }
    const redo = {
      ...first,
      patch: {
        account: [makeAccount({ id: 'cash', title: 'Vault' })],
      },
      issuedAt: 20,
    }
    store.dispatch(appendClientCommand(first))
    store.dispatch(appendClientCommand(redo))
    store.dispatch(undoClientCommand())

    await store.dispatch(syncData() as any)

    expect(syncMock).toHaveBeenCalledWith('', 'ru', {
      account: [expect.objectContaining({ id: 'cash', title: 'Wallet' })],
      serverTimestamp: 100,
    })
    expect(store.getState().data.outbox).toEqual([first])
    expect(store.getState().data.redo).toEqual([])
    expect(store.getState().data.current.account.cash.title).toBe('Wallet')
  })
})
