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
  redoClientCommand,
  undoClientCommand,
} from 'store/data'
import syncReducer from 'store/sync'
import token from 'store/token'
import { refreshData, syncData } from './sync'

function renameCashTo(title: string, issuedAt: number) {
  return {
    type: 'patch' as const,
    patch: { account: [makeAccount({ id: 'cash', title })] },
    issuedAt,
  }
}

/** Store holding one accepted account, so a cursor and an outbox both exist. */
function makeSyncedStore() {
  const store = configureStore({
    reducer: { data, sync: syncReducer, token },
  })
  store.dispatch(
    applyServerPatch({
      serverTimestamp: 100_000,
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    }) as any
  )
  return store
}

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

  it('acknowledges the sent prefix, dropping it from the undo stack', async () => {
    syncMock.mockResolvedValueOnce({ data: { serverTimestamp: 200_000 } })
    const store = makeSyncedStore()
    store.dispatch(appendClientCommand(renameCashTo('Wallet', 10)))

    await store.dispatch(syncData() as any)

    expect(store.getState().data.outbox).toEqual([])
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

describe('refreshData', () => {
  beforeEach(() => {
    syncMock.mockClear()
  })

  it('sends the cursor alone, without any pending entity', async () => {
    syncMock.mockResolvedValueOnce({ data: { serverTimestamp: 200_000 } })
    const store = makeSyncedStore()
    store.dispatch(appendClientCommand(renameCashTo('Wallet', 10)))

    await store.dispatch(refreshData() as any)

    expect(syncMock).toHaveBeenCalledWith('', 'ru', {
      serverTimestamp: 99_000,
    })
  })

  it('keeps pending commands undoable by rebasing them over the new base', async () => {
    // The canonical response carries an unrelated remote change, exactly the
    // background case: a pull must advance `base` without acknowledging
    // anything the user has not chosen to send.
    syncMock.mockResolvedValueOnce({
      data: {
        serverTimestamp: 200_000,
        account: [
          makeAccount({ id: 'card', title: 'Added elsewhere', changed: 150 }),
        ],
      },
    })
    const store = makeSyncedStore()
    const pending = renameCashTo('Wallet', 10)
    store.dispatch(appendClientCommand(pending))

    await store.dispatch(refreshData() as any)

    const state = store.getState().data
    expect(state.outbox).toEqual([pending])
    expect(state.base.serverTimestamp).toBe(200_000)
    expect(state.current.account.card.title).toBe('Added elsewhere')
    // The local rename survived the rebase and is still the last command.
    expect(state.current.account.cash.title).toBe('Wallet')

    store.dispatch(undoClientCommand())
    expect(store.getState().data.current.account.cash.title).toBe('Cash')
  })

  it('keeps the undone tail redoable across the rebase', async () => {
    syncMock.mockResolvedValueOnce({ data: { serverTimestamp: 200_000 } })
    const store = makeSyncedStore()
    const undone = renameCashTo('Wallet', 10)
    store.dispatch(appendClientCommand(undone))
    store.dispatch(undoClientCommand())

    await store.dispatch(refreshData() as any)

    // Background pulls run every couple of idle minutes; losing redo to them
    // would defeat the point of not pushing in the first place.
    expect(store.getState().data.redo).toEqual([undone])
    store.dispatch(redoClientCommand())
    expect(store.getState().data.current.account.cash.title).toBe('Wallet')
    expect(store.getState().data.outbox).toEqual([undone])
  })
})
