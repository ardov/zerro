import { afterEach, describe, expect, it, vi } from 'vitest'

const { saveReplicaStateMock } = vi.hoisted(() => ({
  saveReplicaStateMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('worker', () => ({ saveReplicaState: saveReplicaStateMock }))

import { makeStore } from 'core-next/testing/zenmoneyTestData'
import { appendClientOutboxEntry, prepareClientSync } from './slice'
import {
  getPersistedReplica,
  replicaPersistenceMiddleware,
} from './replicaPersistence'

afterEach(() => {
  vi.unstubAllGlobals()
  saveReplicaStateMock.mockClear()
})

describe('replica persistence snapshot', () => {
  it('stores only versioned replay inputs, including the redo tail', () => {
    const base = makeStore({ serverTimestamp: 100 })
    const entry = {
      id: 'entry-1',
      command: { type: 'test.command' },
      intentPatch: {},
      appliedPatch: {},
      materializerVersion: 1,
      createdAt: 10,
    }

    expect(
      getPersistedReplica({
        data: {
          base,
          current: makeStore({ serverTimestamp: 999 }),
          outbox: [entry],
          outboxHead: 0,
        },
      })
    ).toEqual({
      version: 1,
      baseServerTimestamp: 100,
      outbox: [entry],
      outboxHead: 0,
    })
  })

  it('queues a browser persistence write after a replica mutation', async () => {
    vi.stubGlobal('Worker', class {})
    const current = makeStore({ serverTimestamp: 100 })
    const entry = {
      id: 'entry-1',
      command: { type: 'test.command' },
      intentPatch: {},
      appliedPatch: {},
      materializerVersion: 1,
      createdAt: 10,
    }
    const state = {
      data: {
        base: current,
        current,
        outbox: [entry],
        outboxHead: 1,
      },
    }
    const next = vi.fn(action => action)
    const invoke = (replicaPersistenceMiddleware as any)({
      getState: () => state,
      dispatch: vi.fn(),
    })(next)

    invoke(appendClientOutboxEntry(entry))

    await vi.waitFor(() =>
      expect(saveReplicaStateMock).toHaveBeenCalledWith({
        version: 1,
        baseServerTimestamp: 100,
        outbox: [entry],
        outboxHead: 1,
      })
    )
  })

  it('persists the committed branch prepared for sync', async () => {
    vi.stubGlobal('Worker', class {})
    const current = makeStore({ serverTimestamp: 100 })
    const entry = {
      id: 'entry-1',
      command: { type: 'test.command' },
      intentPatch: {},
      appliedPatch: {},
      materializerVersion: 1,
      createdAt: 10,
    }
    const state = {
      data: {
        base: current,
        current,
        outbox: [entry],
        outboxHead: 1,
      },
    }
    const invoke = (replicaPersistenceMiddleware as any)({
      getState: () => state,
      dispatch: vi.fn(),
    })(vi.fn(action => action))

    invoke(prepareClientSync())

    await vi.waitFor(() =>
      expect(saveReplicaStateMock).toHaveBeenCalledWith({
        version: 1,
        baseServerTimestamp: 100,
        outbox: [entry],
        outboxHead: 1,
      })
    )
  })
})
