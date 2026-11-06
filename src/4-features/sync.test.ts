import { prepareTestCommand as prepareCommand } from '../zerro-core/support/testing/commandTestData'
import {
  testOperations,
  operationPatch,
} from '@/zerro-core/support/testing/commandTestData'
import { configureStore } from '@reduxjs/toolkit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureImmer } from '@/store/immer'
import type { TNormalizedPatch } from '@/6-shared/types'
import * as replica from '@/zerro-core/replica'
import { captureError } from '@/6-shared/diagnostics'

const { syncMock } = vi.hoisted(() => ({
  syncMock: vi.fn(),
}))

vi.mock('@/6-shared/api/syncDiff', () => ({ sync: syncMock }))

vi.mock('@/6-shared/analytics', () => ({ track: vi.fn() }))
vi.mock('@/6-shared/diagnostics', () => ({
  captureError: vi.fn(),
  captureMerchantUserWarnings: vi.fn(),
}))

import {
  makeAccount,
  makeReminder,
  makeTag,
  makeTransaction,
  makeUser,
} from '@/zerro-core/support/testing/zenmoneyTestData'
import { core } from '@/zerro-core/runtime/redux'

import {
  appendClientCommand,
  applyServerPatch,
  hydrateCorruptOutbox,
  hydrateRecoveryOutbox,
  hydrateReplica,
  redoClientCommand,
  undoClientCommand,
} from '@/store/data'
import { rootReducer } from '@/store/rootReducer'
import { refreshData, reloadData, syncData } from './sync'
import { continueSyncLater } from './sync'

function renameCashTo(title: string, issuedAt: number) {
  return {
    operations: testOperations({
      account: [makeAccount({ id: 'cash', title })],
    }),
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
  afterEach(() => {
    configureImmer(false)
    syncMock.mockReset()
    vi.restoreAllMocks()
  })
  beforeEach(() => {
    syncMock.mockClear()
    vi.mocked(captureError).mockClear()
  })

  it('syncs interleaved time edits after reload, undo/redo and a background pull', async () => {
    configureImmer(true)
    let store = makeSyncedStore()
    const created = Date.parse('2026-11-01T12:00:00Z')
    store.dispatch(
      applyServerPatch({
        user: [makeUser({ id: 1, parent: null, currency: 1 })],
        tag: [makeTag({ id: 'food', title: 'Food' })],
        transaction: [
          makeTransaction({
            id: 'first',
            created,
            outcome: 25,
            incomeAccount: 'cash',
            outcomeAccount: 'cash',
          }),
          makeTransaction({
            id: 'second',
            created,
            outcome: 40,
            incomeAccount: 'cash',
            outcomeAccount: 'cash',
            tag: ['food'],
            source: 'plugin',
            payee: 'Test shop',
            originalPayee: 'Test shop',
            outcomeBankID: '[fixture][CUR]-second',
            opIncome: null,
            opOutcome: null,
          }),
        ],
      })
    )
    const firstEdit = store.dispatch(
      core.transactions.recreate({
        id: 'first',
        created: created + 60_000,
        income: 0,
        outcome: 25,
      })
    )
    const secondEdit = store.dispatch(
      core.transactions.recreate({
        id: 'second',
        created: created + 120_000,
        income: 0,
        outcome: 40,
      })
    )
    const finalFirst = store.dispatch(
      core.transactions.recreate({
        id: firstEdit,
        created,
        income: 0,
        outcome: 25,
      })
    )
    const finalSecond = store.dispatch(
      core.transactions.recreate({
        id: secondEdit,
        created,
        income: 0,
        outcome: 40,
      })
    )
    const { base, outbox } = JSON.parse(JSON.stringify(store.getState().data))
    store = configureStore({ reducer: rootReducer })
    store.dispatch(hydrateReplica({ rootUserId: 1, base, outbox }))
    store.dispatch(undoClientCommand())
    expect(store.getState().data.current.transaction[secondEdit].created).toBe(
      created + 120_000
    )
    expect(
      store.getState().data.current.transaction[finalSecond]
    ).toBeUndefined()
    store.dispatch(redoClientCommand())
    store.dispatch(
      applyServerPatch({
        serverTimestamp: 200_000,
        account: [makeAccount({ id: 'cash', title: 'Wallet' })],
      })
    )
    syncMock.mockImplementation(
      async (_token, _endpoint, patch: TNormalizedPatch) => {
        // The live reproduction fails when the request includes an unknown
        // intermediate replacement that is already marked for a hard purge.
        if (patch.transaction?.some(row => row.id === secondEdit))
          return { error: 'serverError', status: 500 }
        return {
          data: {
            serverTimestamp: 300_000,
            transaction: patch.transaction?.filter(
              row => row.id === finalFirst || row.id === finalSecond
            ),
            deletion: ['first', 'second'].map(id => ({
              id,
              object: 'transaction',
              stamp: 300_000,
              user: 1,
            })),
          },
        }
      }
    )

    await store.dispatch(syncData({ sleep: async () => undefined }))

    expect(store.getState().sync.lastResult?.isSuccessful).toBe(true)
    expect(syncMock).toHaveBeenCalledOnce()
    const sent: TNormalizedPatch = syncMock.mock.calls[0][2]
    expect(sent.transaction?.map(row => row.id).sort()).toEqual(
      ['first', 'second', finalFirst, finalSecond].sort()
    )
    for (const id of ['first', 'second'])
      expect(sent.transaction?.find(row => row.id === id)).toMatchObject({
        income: 0.00001,
        outcome: 0.00001,
      })
    expect(store.getState().data.outbox).toEqual([])
    expect(
      Object.keys(store.getState().data.current.transaction).sort()
    ).toEqual([finalFirst, finalSecond].sort())
    expect(store.getState().data.current.transaction[finalFirst]).toMatchObject(
      {
        created,
        outcome: 25,
      }
    )
    expect(
      store.getState().data.current.transaction[finalSecond]
    ).toMatchObject({
      created,
      outcome: 40,
      tag: ['food'],
      payee: 'Test shop',
      outcomeBankID: '[fixture][CUR]-second',
    })
  })

  it('pushes a pending budget after a background pull in production', async () => {
    configureImmer(true)
    const store = makeSyncedStore()
    const comment = JSON.stringify({
      type: 'budgets',
      month: '2026-11',
      payload: {},
    })
    store.dispatch(
      applyServerPatch({
        user: [makeUser({ id: 1, parent: null, currency: 1 })],
        account: [makeAccount({ id: 'data', title: '🤖 [Zerro Data]' })],
        reminder: [makeReminder({ id: 'budget', comment })],
      })
    )
    store.dispatch(
      appendClientCommand({
        issuedAt: 100,
        operations: [
          {
            type: 'budgets.set',
            month: '2026-11',
            values: [{ envelopeId: 'tag#food', amount: 100 }],
            nativeTags: false,
            storage: { accountId: 'data', reminderId: 'budget' },
          },
        ],
      })
    )
    store.dispatch(
      applyServerPatch({
        serverTimestamp: 200_000,
        reminder: [makeReminder({ id: 'remote', comment: 'Another reminder' })],
      })
    )
    syncMock.mockImplementationOnce(async (_token, _endpoint, patch) => ({
      data: { ...patch, serverTimestamp: 300_000 },
    }))

    await store.dispatch(syncData())

    expect(syncMock).toHaveBeenCalledOnce()
    expect(store.getState().sync.lastResult?.isSuccessful).toBe(true)
    expect(store.getState().data.outbox).toEqual([])
    expect(
      JSON.parse(store.getState().data.base.reminder.budget.comment!)
    ).toMatchObject({ payload: { 'tag#food': 100 } })
    expect(store.getState().data.current.reminder.remote.comment).toBe(
      'Another reminder'
    )
  })

  it('reports a preparation failure and leaves pending changes retryable', async () => {
    const store = makeSyncedStore()
    store.dispatch(appendClientCommand(renameCashTo('Wallet', 10)))
    const pending = store.getState().data.outbox
    const error = new TypeError('Cannot perform get on a revoked proxy')
    const prepare = vi
      .spyOn(replica, 'beginPush')
      .mockImplementationOnce(() => {
        throw error
      })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(store.dispatch(syncData())).resolves.toBeUndefined()

    expect(syncMock).not.toHaveBeenCalled()
    expect(captureError).toHaveBeenCalledExactlyOnceWith(error)
    expect(store.getState().data.outbox).toEqual(pending)
    expect(store.getState().sync).toMatchObject({
      status: { kind: 'idle' },
      lastResult: {
        isSuccessful: false,
        errorMessage: 'Cannot perform get on a revoked proxy',
      },
    })
    prepare.mockRestore()
    syncMock.mockResolvedValueOnce({ data: { serverTimestamp: 200_000 } })
    await store.dispatch(syncData())
    expect(store.getState().sync.lastResult?.isSuccessful).toBe(true)
    expect(store.getState().data.outbox).toEqual([])
  })

  it('acknowledges enabling and disabling Zenmoney budgets back to the stored value', async () => {
    const store = makeSyncedStore()
    store.dispatch(
      applyServerPatch({
        user: [makeUser({ id: 1, parent: null, currency: 2 })],
        account: [makeAccount({ id: 'data', title: '🤖 [Zerro Data]' })],
        reminder: [
          makeReminder({
            id: 'settings',
            incomeAccount: 'data',
            outcomeAccount: 'data',
            comment: JSON.stringify({
              type: 'UserSettings',
              payload: { preferZmBudgets: false },
            }),
          }),
        ],
      }) as any
    )
    store.dispatch(core.settings.setPreferZmBudgets(true) as any)
    store.dispatch(core.settings.setPreferZmBudgets(false) as any)
    expect(store.getState().data.outbox).toHaveLength(2)
    syncMock.mockResolvedValueOnce({ data: { serverTimestamp: 200_000 } })

    await store.dispatch(syncData() as any)

    expect(store.getState().data.outbox).toEqual([])
    expect(syncMock).toHaveBeenCalledOnce()
    expect(store.getState().sync.lastResult?.isSuccessful).toBe(true)
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

  it('keeps a failed cursor-only push retryable without opening chunk details', async () => {
    const store = makeSyncedStore()
    store.dispatch(appendClientCommand(renameCashTo('Temporary', 10)))
    store.dispatch(appendClientCommand(renameCashTo('Cash', 20)))
    const outbox = store.getState().data.outbox
    syncMock.mockResolvedValue({ error: 'offline' })
    // The cursor fits, but the unchanged account in the raw transport does not.
    const runtime = { maxBytes: 100, sleep: async () => undefined }

    await store.dispatch(syncData(runtime) as any)

    expect(syncMock).toHaveBeenCalledTimes(4)
    expect(syncMock).toHaveBeenCalledWith('', 'ru', { serverTimestamp: 99_000 })
    expect(store.getState().sync).toMatchObject({
      status: { kind: 'idle' },
      detailsOpen: false,
      lastResult: { isSuccessful: false, errorMessage: 'offline' },
    })
    expect(store.getState().data.outbox).toEqual(outbox)
    store.dispatch(undoClientCommand())
    expect(store.getState().data.current.account.cash.title).toBe('Temporary')
    store.dispatch(redoClientCommand())
    expect(store.getState().data.current.account.cash.title).toBe('Cash')

    syncMock.mockResolvedValueOnce({ data: { serverTimestamp: 200_000 } })
    await store.dispatch(syncData(runtime) as any)

    expect(store.getState().data.outbox).toEqual([])
    expect(store.getState().sync.lastResult?.isSuccessful).toBe(true)
    expect(store.getState().sync.detailsOpen).toBe(false)
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
      operations: testOperations({
        account: [makeAccount({ id: 'cash', title: 'Wallet' })],
      }),
      issuedAt: 10,
    }
    const redo = {
      ...first,
      operations: testOperations({
        account: [makeAccount({ id: 'cash', title: 'Vault' })],
      }),
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
          expect(operationPatch(outbox[0]).account).toHaveLength(1)
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
        prepareCommand(
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
    issuedAt: 10,
    operations: testOperations({
      account: [
        makeAccount({ id: 'cash', title: 'Wallet' }),
        makeAccount({ id: 'card', title: 'Credit card' }),
      ],
    }),
  }
}
