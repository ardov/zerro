import { configureStore } from '@reduxjs/toolkit'
import { describe, expect, it, vi } from 'vitest'

const { syncMock } = vi.hoisted(() => ({
  syncMock: vi.fn(),
}))

vi.mock('worker', () => ({
  sync: syncMock,
  saveLocalData: vi.fn(),
}))

vi.mock('6-shared/helpers/tracking', () => ({ sendEvent: vi.fn() }))

import { makeAccount } from 'zerro-core/testing/zenmoneyTestData'
import data, {
  appendClientOutboxEntry,
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
      id: 'entry-1',
      command: { type: 'account.rename', title: 'Wallet' },
      intentPatch: {
        account: [makeAccount({ id: 'cash', title: 'Wallet' })],
      },
      appliedPatch: {
        account: [makeAccount({ id: 'cash', title: 'Wallet' })],
      },
      materializerVersion: 1,
      createdAt: 10,
    }
    const redo = {
      ...first,
      id: 'entry-2',
      command: { type: 'account.rename', title: 'Vault' },
      intentPatch: {
        account: [makeAccount({ id: 'cash', title: 'Vault' })],
      },
      appliedPatch: {
        account: [makeAccount({ id: 'cash', title: 'Vault' })],
      },
      createdAt: 20,
    }
    store.dispatch(appendClientOutboxEntry(first))
    store.dispatch(appendClientOutboxEntry(redo))
    store.dispatch(undoClientCommand())

    await store.dispatch(syncData() as any)

    expect(syncMock).toHaveBeenCalledWith('', 'ru', {
      account: [expect.objectContaining({ id: 'cash', title: 'Wallet' })],
      serverTimestamp: 100,
    })
    expect(store.getState().data.outbox?.map(entry => entry.id)).toEqual([
      'entry-1',
    ])
    expect(store.getState().data.outboxHead).toBe(1)
    expect(store.getState().data.current.account.cash.title).toBe('Wallet')
  })
})
