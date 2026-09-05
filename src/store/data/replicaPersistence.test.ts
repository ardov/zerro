import { afterEach, describe, expect, it, vi } from 'vitest'

const { storageMock } = vi.hoisted(() => ({
  storageMock: {
    saveOutbox: vi.fn().mockResolvedValue(undefined),
    commitCanonical: vi.fn().mockResolvedValue(undefined),
    compactOneBatch: vi.fn().mockResolvedValue({ entriesDeleted: 0 }),
    clear: vi.fn().mockResolvedValue(undefined),
    discardOutbox: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/6-shared/api/replicaStorage', () => ({
  replicaStorage: storageMock,
}))

import type { TCommand } from '@/zerro-core/replica'
import { makeStore } from '@/zerro-core/support/testing/zenmoneyTestData'
import { patchTransactionsPage } from '../view'
import {
  acceptClientPushChunk,
  appendClientCommand,
  applyServerPatch,
} from './slice'
import {
  clearPersistedLocalData,
  replicaPersistenceMiddleware,
  resetReplicaPersistenceForTests,
} from './replicaPersistence'

const entry = { type: 'patch' as const, patch: {}, issuedAt: 10 }

afterEach(() => {
  vi.restoreAllMocks()
  resetReplicaPersistenceForTests()
  Object.values(storageMock).forEach(mock => mock.mockClear())
})

describe('replica persistence queue', () => {
  it('stores the durable outbox after a local command', async () => {
    const state = replicaState()
    const invoke = middleware(state)

    invoke(appendClientCommand(entry))

    await vi.waitFor(() =>
      expect(storageMock.saveOutbox).toHaveBeenCalledWith(7, [entry])
    )
  })

  it('commits canonical base and outbox together, then attempts compaction', async () => {
    const state = replicaState()
    const invoke = middleware(state)
    invoke(applyServerPatch({ serverTimestamp: 200 }))

    await vi.waitFor(() =>
      expect(storageMock.commitCanonical).toHaveBeenCalledWith({
        before: expect.objectContaining({ serverTimestamp: 100 }),
        after: expect.objectContaining({ serverTimestamp: 200 }),
        outbox: [],
        pushed: false,
        checkpointReason: undefined,
      })
    )
    await vi.waitFor(() =>
      expect(storageMock.compactOneBatch).toHaveBeenCalledOnce()
    )
  })

  it('commits every accepted push chunk with its remaining outbox', async () => {
    const state = replicaState()
    state.data.outbox = [entry]
    const invoke = middleware(state)
    const after = makeStore({ serverTimestamp: 150 })
    const remainder = { ...entry, issuedAt: 20 }

    invoke(
      acceptClientPushChunk({
        base: after,
        current: after,
        outbox: [remainder],
        redo: [],
      })
    )

    await vi.waitFor(() =>
      expect(storageMock.commitCanonical).toHaveBeenCalledWith({
        before: expect.objectContaining({ serverTimestamp: 100 }),
        after,
        outbox: [remainder],
        pushed: true,
      })
    )
  })

  it('records recovery as the checkpoint reason even for a full reload', async () => {
    const state = replicaState()
    state.data.journalRecoveryRequired = true
    const invoke = middleware(state)
    invoke(applyServerPatch({ serverTimestamp: 200, fullReload: true }))

    await vi.waitFor(() =>
      expect(storageMock.commitCanonical).toHaveBeenCalledWith(
        expect.objectContaining({ checkpointReason: 'recovery' })
      )
    )
  })

  it('does not persist transient view actions and always clears on logout', async () => {
    const state = replicaState()
    const invoke = middleware(state)

    invoke(patchTransactionsPage({ search: 'coffee' }))
    await clearPersistedLocalData()

    expect(storageMock.saveOutbox).not.toHaveBeenCalled()
    expect(storageMock.clear).toHaveBeenCalledOnce()
  })

  it('waits for a root user before creating the first replica', async () => {
    const state = replicaState()
    state.data.rootUserId = null
    const invoke = middleware(state)
    invoke(applyServerPatch({ serverTimestamp: 200 }))

    await Promise.resolve()

    expect(storageMock.commitCanonical).not.toHaveBeenCalled()
  })

  it('disables later primary writes after the first persistence failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    storageMock.saveOutbox.mockRejectedValueOnce(new Error('quota exceeded'))
    const state = replicaState()
    const dispatched: unknown[] = []
    const invoke = (replicaPersistenceMiddleware as any)({
      getState: () => state,
      dispatch: (action: unknown) => dispatched.push(action),
    })((action: any) => {
      if (appendClientCommand.match(action))
        state.data.outbox.push(action.payload)
      return action
    })

    invoke(appendClientCommand(entry))
    await vi.waitFor(() => expect(dispatched).toHaveLength(1))
    invoke(appendClientCommand({ ...entry, issuedAt: 20 }))
    await Promise.resolve()

    expect(storageMock.saveOutbox).toHaveBeenCalledOnce()
    expect(dispatched[0]).toMatchObject({
      type: 'data/persistenceFailed',
      payload: { reason: 'quota exceeded' },
    })
  })

  it('does not overwrite a corrupt persisted outbox before explicit discard', async () => {
    const state = replicaState()
    state.data.outboxRecoveryReason = 'outbox[0] is invalid'
    const invoke = middleware(state)

    invoke(appendClientCommand(entry))
    invoke(applyServerPatch({ serverTimestamp: 200 }))
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(storageMock.saveOutbox).not.toHaveBeenCalled()
    expect(storageMock.commitCanonical).not.toHaveBeenCalled()
  })

  it('does not persist outbox mutations while journal recovery is pending', async () => {
    const state = replicaState()
    state.data.journalRecoveryRequired = true
    const invoke = middleware(state)

    invoke(appendClientCommand(entry))
    await Promise.resolve()
    await Promise.resolve()

    expect(storageMock.saveOutbox).not.toHaveBeenCalled()
  })
})

function replicaState() {
  return {
    data: {
      rootUserId: 7 as number | null,
      base: makeStore({ serverTimestamp: 100 }),
      current: makeStore({ serverTimestamp: 100 }),
      outbox: [] as TCommand[],
      redo: [] as TCommand[],
      journalRecoveryRequired: false,
      outboxRecoveryReason: null as string | null,
    },
  }
}

function middleware(state: ReturnType<typeof replicaState>) {
  const dispatch = vi.fn()
  const invoke = (replicaPersistenceMiddleware as any)({
    getState: () => state,
    dispatch,
  })((action: any) => {
    if (applyServerPatch.match(action)) {
      state.data.base = {
        ...state.data.base,
        serverTimestamp: action.payload.serverTimestamp ?? 100,
      }
      state.data.current = state.data.base
    }
    if (appendClientCommand.match(action))
      state.data.outbox.push(action.payload)
    if (acceptClientPushChunk.match(action)) {
      state.data.base = action.payload.base
      state.data.current = action.payload.current
      state.data.outbox = action.payload.outbox
      state.data.redo = action.payload.redo
    }
    return action
  })
  return invoke
}
