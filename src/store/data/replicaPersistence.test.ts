import { afterEach, describe, expect, it, vi } from 'vitest'

const { clearStorageMock, saveReplicaStateMock } = vi.hoisted(() => ({
  clearStorageMock: vi.fn().mockResolvedValue(undefined),
  saveReplicaStateMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('6-shared/api/localStore', () => ({
  clearStorage: clearStorageMock,
  saveReplicaState: saveReplicaStateMock,
}))

import { makeStore } from 'zerro-core/support/testing/zenmoneyTestData'
import type { TCommand } from 'zerro-core/replica'
import { appendClientCommand } from './slice'
import {
  clearPersistedLocalData,
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
