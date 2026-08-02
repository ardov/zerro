import { afterEach, describe, expect, it, vi } from 'vitest'

const { clearStorageMock, saveJournalStateMock, saveReplicaStateMock } =
  vi.hoisted(() => ({
    clearStorageMock: vi.fn().mockResolvedValue(undefined),
    saveJournalStateMock: vi.fn().mockResolvedValue(undefined),
    saveReplicaStateMock: vi.fn().mockResolvedValue(undefined),
  }))

vi.mock('6-shared/api/localStore', () => ({
  clearStorage: clearStorageMock,
  saveJournalState: saveJournalStateMock,
  saveReplicaState: saveReplicaStateMock,
}))

import { makeStore } from 'zerro-core/support/testing/zenmoneyTestData'
import {
  createJournalBranch,
  journalPersistenceVersion,
  type TCommand,
} from 'zerro-core/replica'
import { patchTransactionsPage } from '../view'
import { appendClientCommand } from './slice'
import {
  clearPersistedLocalData,
  getPersistedJournal,
  getPersistedReplica,
  replicaPersistenceMiddleware,
} from './replicaPersistence'

const entry: TCommand = {
  type: 'patch',
  patch: {},
  issuedAt: 10,
}

afterEach(() => {
  vi.unstubAllGlobals()
  clearStorageMock.mockClear()
  saveReplicaStateMock.mockClear()
  saveJournalStateMock.mockClear()
})

describe('replica persistence snapshot', () => {
  it('stores only the durable command outbox', () => {
    const base = makeStore({ serverTimestamp: 100 })

    expect(
      getPersistedReplica({
        data: {
          base,
          current: makeStore({ serverTimestamp: 999 }),
          outbox: [entry],
        },
      })
    ).toEqual({
      version: 3,
      baseServerTimestamp: 100,
      outbox: [entry],
    })
  })

  it('stores the accepted journal unless it is quarantined', () => {
    const base = makeStore({ serverTimestamp: 100 })
    const journal = {
      version: journalPersistenceVersion,
      activeBranchId: 'main',
      branches: [createJournalBranch('main', base)],
    }
    const state = {
      data: {
        base,
        current: base,
        outbox: [],
        journal,
        journalPersistenceBlocked: false,
      },
    }

    expect(getPersistedJournal(state)).toEqual(journal)
    expect(
      getPersistedJournal({
        data: { ...state.data, journalPersistenceBlocked: true },
      })
    ).toBeUndefined()
  })

  it('queues journal persistence alongside a replica mutation', async () => {
    const current = makeStore({ serverTimestamp: 100 })
    const journal = {
      version: journalPersistenceVersion,
      activeBranchId: 'main',
      branches: [createJournalBranch('main', current)],
    }
    const state = {
      data: {
        base: current,
        current,
        outbox: [entry],
        journal,
        journalPersistenceBlocked: false,
      },
    }
    const invoke = (replicaPersistenceMiddleware as any)({
      getState: () => state,
      dispatch: vi.fn(),
    })(vi.fn(nextAction => nextAction))

    invoke(appendClientCommand(entry))

    await vi.waitFor(() =>
      expect(saveJournalStateMock).toHaveBeenCalledWith(journal)
    )
  })

  it('queues a browser persistence write after a command', async () => {
    const current = makeStore({ serverTimestamp: 100 })
    const state = {
      data: {
        base: current,
        current,
        outbox: [entry],
      },
    }
    const invoke = (replicaPersistenceMiddleware as any)({
      getState: () => state,
      dispatch: vi.fn(),
    })(vi.fn(nextAction => nextAction))

    invoke(appendClientCommand(entry))

    await vi.waitFor(() =>
      expect(saveReplicaStateMock).toHaveBeenCalledWith({
        version: 3,
        baseServerTimestamp: 100,
        outbox: [entry],
      })
    )
  })

  it('does not persist transient view actions', async () => {
    const current = makeStore({ serverTimestamp: 100 })
    const invoke = (replicaPersistenceMiddleware as any)({
      getState: () => ({ data: { base: current, current, outbox: [] } }),
      dispatch: vi.fn(),
    })(vi.fn(nextAction => nextAction))

    invoke(patchTransactionsPage({ search: 'coffee' }))

    await Promise.resolve()
    expect(saveReplicaStateMock).not.toHaveBeenCalled()
  })

  it('clears storage after invalidating saves from the previous login', async () => {
    const current = makeStore({ serverTimestamp: 100 })
    const invoke = (replicaPersistenceMiddleware as any)({
      getState: () => ({ data: { base: current, current, outbox: [entry] } }),
      dispatch: vi.fn(),
    })(vi.fn(nextAction => nextAction))

    invoke(appendClientCommand(entry))
    await clearPersistedLocalData()

    expect(clearStorageMock).toHaveBeenCalledOnce()
    expect(saveReplicaStateMock).not.toHaveBeenCalled()
  })
})
