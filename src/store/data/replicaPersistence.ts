import type { Middleware } from '@reduxjs/toolkit'
import type { TDataStore } from '6-shared/types'
import {
  replicaPersistenceVersion,
  type TPersistedReplica,
} from 'core-next/engine/persistence'
import type { TOutboxEntry } from 'core-next/engine/outbox'
import {
  appendClientOutboxEntry,
  rebaseServerInbox,
  redoClientCommand,
  resetData,
  restorePersistedReplica,
  undoClientCommand,
} from './slice'

type TReplicaStateSource = {
  data: {
    current: TDataStore
    server?: TDataStore
    outbox?: TOutboxEntry<unknown>[]
    outboxHead?: number
  }
}

export function getPersistedReplica(
  state: TReplicaStateSource
): TPersistedReplica {
  const outbox = state.data.outbox ?? []
  return {
    version: replicaPersistenceVersion,
    baseServerTimestamp:
      state.data.server?.serverTimestamp ?? state.data.current.serverTimestamp,
    outbox: [...outbox],
    outboxHead: state.data.outboxHead ?? outbox.length,
  }
}

let saveQueue: Promise<unknown> = Promise.resolve()

export const replicaPersistenceMiddleware: Middleware =
  api => next => action => {
    const result = next(action)
    if (isReplicaMutation(action) && typeof Worker !== 'undefined') {
      const snapshot = getPersistedReplica(
        api.getState() as TReplicaStateSource
      )
      saveQueue = saveQueue
        .catch(() => undefined)
        .then(async () => {
          const { saveReplicaState } = await import('worker')
          await saveReplicaState(snapshot)
        })
        .catch(error => console.error('Failed to persist Core replica', error))
    }
    return result
  }

function isReplicaMutation(action: unknown): boolean {
  return (
    appendClientOutboxEntry.match(action) ||
    undoClientCommand.match(action) ||
    redoClientCommand.match(action) ||
    rebaseServerInbox.match(action) ||
    restorePersistedReplica.match(action) ||
    resetData.match(action)
  )
}
