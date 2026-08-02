import type { Middleware } from '@reduxjs/toolkit'
import type { TDataStore } from '6-shared/types'
import {
  replicaPersistenceVersion,
  type TCommand,
  type TPersistedJournal,
  type TPersistedReplica,
} from 'zerro-core/replica'
import {
  clearStorage,
  saveJournalState,
  saveReplicaState,
} from '6-shared/api/localStore'
import {
  appendClientCommand,
  rebaseServerInbox,
  redoClientCommand,
  resetData,
  restorePersistedReplica,
  restorePersistedJournal,
  undoClientCommand,
} from './slice'

type TReplicaStateSource = {
  data: {
    current: TDataStore
    base: TDataStore
    outbox: TCommand[]
    journal?: TPersistedJournal | null
    journalPersistenceBlocked?: boolean
  }
}

export function getPersistedReplica(
  state: TReplicaStateSource
): TPersistedReplica {
  const outbox = state.data.outbox
  return {
    version: replicaPersistenceVersion,
    baseServerTimestamp: state.data.base.serverTimestamp,
    outbox: [...outbox],
  }
}

export function getPersistedJournal(
  state: TReplicaStateSource
): TPersistedJournal | undefined {
  if (state.data.journalPersistenceBlocked === true) return undefined
  return state.data.journal ?? undefined
}

let saveQueue: Promise<unknown> = Promise.resolve()
let persistenceGeneration = 0

export const replicaPersistenceMiddleware: Middleware =
  api => next => action => {
    const result = next(action)
    if (isReplicaMutation(action)) {
      const snapshot = getPersistedReplica(
        api.getState() as TReplicaStateSource
      )
      const journal = getPersistedJournal(api.getState() as TReplicaStateSource)
      const generation = persistenceGeneration
      saveQueue = saveQueue
        .catch(() => undefined)
        .then(async () => {
          if (generation !== persistenceGeneration) return
          await saveReplicaState(snapshot)
          if (journal) await saveJournalState(journal)
        })
        .catch(error => console.error('Failed to persist Core replica', error))
    }
    return result
  }

/** Clears all browser data after every save from the previous login is done. */
export function clearPersistedLocalData(): Promise<void> {
  persistenceGeneration += 1
  const clear = saveQueue.catch(() => undefined).then(() => clearStorage())
  saveQueue = clear.catch(error =>
    console.error('Failed to clear local data', error)
  )
  return clear
}

function isReplicaMutation(action: unknown): boolean {
  return (
    appendClientCommand.match(action) ||
    undoClientCommand.match(action) ||
    redoClientCommand.match(action) ||
    rebaseServerInbox.match(action) ||
    restorePersistedReplica.match(action) ||
    restorePersistedJournal.match(action) ||
    resetData.match(action)
  )
}
