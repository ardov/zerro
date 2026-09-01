import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { syncMock } = vi.hoisted(() => ({
  syncMock: vi.fn(),
}))

vi.mock('@/6-shared/api/syncDiff', () => ({ sync: syncMock }))

vi.mock('@/6-shared/analytics', () => ({ track: vi.fn() }))

import {
  makeAccount,
  makeUser,
} from '@/zerro-core/support/testing/zenmoneyTestData'
import { issuePatch } from '@/zerro-core/headless'
import {
  appendClientCommand,
  applyServerPatch,
  hydrateCorruptOutbox,
  hydrateRecoveryOutbox,
  redoClientCommand,
  undoClientCommand,
} from '@/store/data'
import { rootReducer } from '@/store/rootReducer'
import { refreshData, reloadData, syncData } from './sync'
import { continueSyncLater } from './sync'

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
    reducer: rootReducer,
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
      reducer: rootReducer,
    })

    await store.dispatch(syncData() as any)

    expect(store.getState().sync).toMatchObject({
      status: { kind: 'idle' },
      lastResult: { isSuccessful: true, errorMessage: null },
    })
    // A fresh replica still asks for a full sync: the overlap never turns a
    // zero cursor into an incremental one.
    expect(syncMock).toHaveBeenCalledWith('', 'ru', { serverTimestamp: 0 })
    expect(store.getState().data.current.serverTimestamp).toBe(200)
  })

  it('does not contact the server while the persisted outbox is quarantined', async () => {
    const store = configureStore({
      reducer: rootReducer,
    })
    store.dispatch(
      hydrateCorruptOutbox({
        rootUserId: 7,
        base: store.getState().data.base,
        reason: 'outbox[0] is invalid',
      })
    )

    await store.dispatch(syncData() as any)

    expect(syncMock).not.toHaveBeenCalled()
    expect(store.getState().sync.status.kind).toBe('idle')
  })

  it('allows only a full reload while the canonical journal is recovering', async () => {
    const store = configureStore({
      reducer: rootReducer,
    })
    store.dispatch(
      hydrateRecoveryOutbox({
        rootUserId: 7,
        outbox: [],
        reason: 'broken checkpoint',
      })
    )

    await store.dispatch(syncData() as any)
    await store.dispatch(refreshData() as any)

    expect(syncMock).not.toHaveBeenCalled()
  })

  it('drops the redo tail before building a failed request payload', async () => {
    syncMock.mockResolvedValueOnce({ error: 'offline', status: 400 })
    const store = configureStore({
      reducer: rootReducer,
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
      status: { kind: 'idle' },
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

  it('publishes hidden details while an ordinary one-request push is active', async () => {
    const store = makeSyncedStore()
    store.dispatch(appendClientCommand(renameCashTo('Wallet', 10)))
    let resolveSync: ((value: unknown) => void) | undefined
    syncMock.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveSync = resolve
        })
    )

    const syncing = store.dispatch(syncData() as any)
    await vi.waitFor(() =>
      expect(store.getState().sync).toMatchObject({
        detailsOpen: false,
        status: {
          kind: 'pushing',
          phase: 'sending',
          rows: [{ key: 'account', confirmed: 0, total: 1 }],
        },
      })
    )

    resolveSync?.({ data: { serverTimestamp: 200_000 } })
    await syncing

    expect(store.getState().sync.status).toEqual({ kind: 'idle' })
  })

  /**
   * A network failure answers without a status rather than throwing, so an
   * offline push exhausts its retries and still has to come back to rest.
   * Anything else leaves undo, redo and background pull switched off.
   */
  it('returns to rest after an offline one-request push', async () => {
    syncMock.mockResolvedValue({ error: 'Failed to fetch' })
    const store = makeSyncedStore()
    store.dispatch(appendClientCommand(renameCashTo('Wallet', 10)))

    await store.dispatch(syncData({ sleep: async () => undefined }) as any)

    expect(syncMock).toHaveBeenCalledTimes(4)
    expect(store.getState().sync).toMatchObject({
      detailsOpen: false,
      status: { kind: 'idle' },
      lastResult: { isSuccessful: false, errorMessage: 'Failed to fetch' },
    })
    expect(store.getState().data.outbox).toHaveLength(1)
  })

  it('accepts a frozen multi-chunk batch one durable remainder at a time', async () => {
    const store = makeTwoAccountStore()
    store.dispatch(appendClientCommand(renameBothAccounts()))
    let responseTimestamp = 200_000
    syncMock.mockImplementation(
      async (_token: string, _preference: string, request: any) => {
        if (syncMock.mock.calls.length === 2) {
          const outbox = store.getState().data.outbox
          expect(outbox).toHaveLength(1)
          expect(outbox[0].patch.account).toHaveLength(1)
        }
        responseTimestamp += 1000
        return { data: { ...request, serverTimestamp: responseTimestamp } }
      }
    )

    await store.dispatch(syncData({ maxBytes: 1 }) as any)

    expect(syncMock).toHaveBeenCalledTimes(2)
    expect(store.getState().data.outbox).toEqual([])
    expect(store.getState().sync.status.kind).toBe('idle')
  })

  it('remembers the byte limit a 413 established when the run then stops', async () => {
    const store = makeTwoAccountStore()
    store.dispatch(appendClientCommand(renameBothAccounts()))
    syncMock.mockImplementation(
      async (_token: string, _preference: string, request: any) =>
        (request.account?.length ?? 0) > 1
          ? { error: 'too large', status: 413 }
          : { error: 'invalid row', status: 400 }
    )

    await store.dispatch(syncData({ maxBytes: 10_000 }) as any)

    const status = store.getState().sync.status
    expect(status).toMatchObject({
      kind: 'stopped',
      errorMessage: 'invalid row',
    })
    expect(status.kind === 'stopped' && status.maxBytes).toBeLessThan(10_000)
  })

  it('stops a failed multi-chunk run with its remainder and can continue later', async () => {
    const store = makeTwoAccountStore()
    store.dispatch(appendClientCommand(renameBothAccounts()))
    syncMock
      .mockImplementationOnce(
        async (_token: string, _preference: string, request: any) => ({
          data: { ...request, serverTimestamp: 200_000 },
        })
      )
      .mockResolvedValueOnce({ error: 'invalid row', status: 400 })

    await store.dispatch(syncData({ maxBytes: 1 }) as any)

    expect(store.getState().sync).toMatchObject({
      status: { kind: 'stopped', errorMessage: 'invalid row' },
    })
    expect(store.getState().data.outbox).toHaveLength(1)

    store.dispatch(continueSyncLater() as any)
    expect(store.getState().sync).toMatchObject({
      status: { kind: 'idle' },
      lastResult: { isSuccessful: false, errorMessage: 'invalid row' },
    })
    expect(store.getState().data.outbox).toHaveLength(1)
  })

  it('keeps one timed-out account deletion visible and pending', async () => {
    const store = makeSyncedStore()
    store.dispatch(
      applyServerPatch({
        serverTimestamp: 101_000,
        user: [makeUser({ id: 1, parent: null, currency: 1 })],
      }) as any
    )
    store.dispatch(
      appendClientCommand(
        issuePatch(
          store.getState().data.current,
          { deletion: [{ id: 'cash', object: 'account' }] },
          10
        )
      )
    )
    syncMock.mockResolvedValue({
      error: 'Unparsable diff response (HTTP 504)',
      status: 504,
    })
    await store.dispatch(
      syncData({
        sleep: async () => {
          expect(store.getState().sync.status).toMatchObject({
            kind: 'pushing',
            phase: 'waiting',
            errorStatus: 504,
          })
        },
      }) as any
    )

    expect(store.getState().sync).toMatchObject({
      detailsOpen: true,
      status: {
        kind: 'stopped',
        errorStatus: 504,
        errorMessage: 'Unparsable diff response (HTTP 504)',
      },
    })
    expect(store.getState().data.outbox).toHaveLength(1)
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

describe('reloadData', () => {
  beforeEach(() => {
    syncMock.mockClear()
  })

  it('requests a complete pull and keeps pending commands during recovery', async () => {
    syncMock.mockResolvedValueOnce({
      data: {
        serverTimestamp: 300_000,
        account: [makeAccount({ id: 'cash', title: 'Server Cash' })],
      },
    })
    const store = makeSyncedStore()
    const pending = renameCashTo('Wallet', 10)
    store.dispatch(appendClientCommand(pending))
    store.dispatch(
      hydrateRecoveryOutbox({
        rootUserId: 7,
        outbox: [pending],
        reason: 'broken checkpoint',
      })
    )

    await store.dispatch(reloadData() as any)

    expect(syncMock).toHaveBeenCalledWith('', 'ru', { serverTimestamp: 0 })
    const state = store.getState().data
    expect(state.base.account.cash.title).toBe('Server Cash')
    expect(state.current.account.cash.title).toBe('Wallet')
    expect(state.outbox).toEqual([pending])
  })
})

function makeTwoAccountStore() {
  const store = makeSyncedStore()
  store.dispatch(
    applyServerPatch({
      serverTimestamp: 101_000,
      account: [makeAccount({ id: 'card', title: 'Card' })],
    }) as any
  )
  return store
}

function renameBothAccounts() {
  return {
    type: 'patch' as const,
    issuedAt: 10,
    patch: {
      account: [
        makeAccount({ id: 'cash', title: 'Wallet' }),
        makeAccount({ id: 'card', title: 'Credit card' }),
      ],
    },
  }
}
