import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
import syncReducer from 'store/sync'
import token from 'store/token'
import { syncData } from './sync'

describe('syncData', () => {
  beforeEach(() => {
    syncMock.mockClear()
  })

  it('records a successful result after applying the canonical response', async () => {
    syncMock.mockResolvedValueOnce({
      data: { serverTimestamp: 200 },
    })
    const store = configureStore({
      reducer: { data, sync: syncReducer, token },
    })

    await store.dispatch(syncData() as any)

    expect(store.getState().sync).toMatchObject({
      status: 'idle',
      lastResult: { isSuccessful: true, errorMessage: null },
    })
    // A fresh replica still asks for a full sync: the overlap never turns a
    // zero cursor into an incremental one.
    expect(syncMock).toHaveBeenCalledWith('', 'ru', { serverTimestamp: 0 })
    expect(store.getState().data.current.serverTimestamp).toBe(200)
  })

  it('drops the redo tail before building a failed request payload', async () => {
    syncMock.mockResolvedValueOnce({ error: 'offline' })
    const store = configureStore({
      reducer: { data, sync: syncReducer, token },
    })
    store.dispatch(
      applyServerPatch({
        serverTimestamp: 100_000,
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

    // The sent cursor overlaps the accepted base by one second, so an entity
    // committed in the same second as the previous response is not skipped.
    expect(syncMock).toHaveBeenCalledWith('', 'ru', {
      account: [expect.objectContaining({ id: 'cash', title: 'Wallet' })],
      serverTimestamp: 99_000,
    })
    expect(store.getState().data.outbox).toEqual([first])
    expect(store.getState().data.redo).toEqual([])
    expect(store.getState().data.current.account.cash.title).toBe('Wallet')
    expect(store.getState().sync).toMatchObject({
      status: 'idle',
      lastResult: { isSuccessful: false, errorMessage: 'offline' },
    })
  })

  it('settles pending state when the transport throws', async () => {
    syncMock.mockRejectedValueOnce(new Error('network unavailable'))
    const store = configureStore({
      reducer: { data, sync: syncReducer, token },
    })

    await store.dispatch(syncData() as any)

    expect(store.getState().sync).toMatchObject({
      status: 'idle',
      lastResult: {
        isSuccessful: false,
        errorMessage: 'network unavailable',
      },
    })
  })
})
