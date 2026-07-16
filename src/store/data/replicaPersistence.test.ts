import { afterEach, describe, expect, it, vi } from 'vitest'

const { saveReplicaStateMock } = vi.hoisted(() => ({
  saveReplicaStateMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('worker', () => ({ saveReplicaState: saveReplicaStateMock }))

import { makeStore } from 'zerro-core/testing/zenmoneyTestData'
import type { TOutboxEntry } from 'zerro-core/infrastructure/replica/outbox'
import { appendClientOutboxEntry, prepareClientSync } from './slice'
import {
  getPersistedReplica,
  replicaPersistenceMiddleware,
} from './replicaPersistence'

const entry: TOutboxEntry = {
  type: 'patch',
  payload: {},
  createdAt: 10,
}

afterEach(() => {
  vi.unstubAllGlobals()
  saveReplicaStateMock.mockClear()
})

describe('replica persistence snapshot', () => {
  it('stores only versioned commands, including the redo tail', () => {
    const base = makeStore({ serverTimestamp: 100 })

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

  it.each([appendClientOutboxEntry(entry), prepareClientSync()])(
    'queues a browser persistence write after %s',
    async action => {
      vi.stubGlobal('Worker', class {})
      const current = makeStore({ serverTimestamp: 100 })
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
      })(vi.fn(nextAction => nextAction))

      invoke(action)

      await vi.waitFor(() =>
        expect(saveReplicaStateMock).toHaveBeenCalledWith({
          version: 1,
          baseServerTimestamp: 100,
          outbox: [entry],
          outboxHead: 1,
        })
      )
    }
  )
})
