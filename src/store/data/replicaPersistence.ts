import type { Middleware } from '@reduxjs/toolkit'
import type { TDataStore } from '@/6-shared/types'
import type { TCommand } from '@/zerro-core/replica'
import { replicaStorage } from '@/6-shared/api/replicaStorage'
import {
  acceptClientPushChunk,
  appendClientCommand,
  persistenceFailed,
  rebaseServerInbox,
  redoClientCommand,
  resetData,
  restoreOutboxPosition,
  undoClientCommand,
  type TServerInbox,
} from './slice'

type TReplicaStateSource = {
  data: {
    rootUserId: number | null
    current: TDataStore
    base: TDataStore
    outbox: TCommand[]
    journalRecoveryRequired: boolean
    outboxRecoveryReason: string | null
    inbox?: TServerInbox | null
  }
}

let saveQueue: Promise<unknown> = Promise.resolve()
let persistenceGeneration = 0
let primaryWritesDisabled = false

export const replicaPersistenceMiddleware: Middleware =
  api => next => action => {
    const before = api.getState() as TReplicaStateSource
    const beforeBase = before.data.base
    const beforeInbox = before.data.inbox
    const beforeRootUserId = before.data.rootUserId
    const recoveryRequired = before.data.journalRecoveryRequired
    const result = next(action)
    const after = api.getState() as TReplicaStateSource

    // Narrower than `getReplicaWriteBlocked`, and read across the action so a
    // state that is entered or left by this very action still counts: a
    // quarantined outbox must never be overwritten, while journal recovery
    // stands down only for the canonical rebase that resolves it.
    const outboxQuarantined =
      before.data.outboxRecoveryReason !== null ||
      after.data.outboxRecoveryReason !== null
    const recovering =
      before.data.journalRecoveryRequired || after.data.journalRecoveryRequired
    if (
      primaryWritesDisabled ||
      resetData.match(action) ||
      outboxQuarantined ||
      (recovering && !rebaseServerInbox.match(action))
    )
      return result

    if (rebaseServerInbox.match(action)) {
      const inbox = beforeInbox
      if (!inbox || after.data.rootUserId === null) return result
      const checkpointReason = recoveryRequired
        ? 'recovery'
        : inbox.fullReload
          ? 'full-sync'
          : beforeRootUserId === null
            ? 'full-sync'
            : undefined
      enqueuePrimary(api.dispatch, async () => {
        await replicaStorage.commitCanonical({
          before: beforeBase,
          after: after.data.base,
          outbox: after.data.outbox,
          pushed: false,
          checkpointReason,
        })
        // Retention is secondary: a failed pass only postpones it and must
        // never mark the primary write as failed.
        await replicaStorage
          .compactOneBatch()
          .catch(error =>
            console.warn('Failed to compact replica history', error)
          )
      })
      return result
    }

    if (acceptClientPushChunk.match(action)) {
      if (after.data.rootUserId === null) return result
      enqueuePrimary(api.dispatch, async () => {
        await replicaStorage.commitCanonical({
          before: beforeBase,
          after: after.data.base,
          outbox: after.data.outbox,
          pushed: true,
        })
        await replicaStorage
          .compactOneBatch()
          .catch(error =>
            console.warn('Failed to compact replica history', error)
          )
      })
      return result
    }

    if (isOutboxMutation(action) && after.data.rootUserId !== null) {
      const rootUserId = after.data.rootUserId
      const outbox = [...after.data.outbox]
      enqueuePrimary(api.dispatch, () =>
        replicaStorage.saveOutbox(rootUserId, outbox)
      )
    }
    return result
  }

/**
 * Clears both stores after every save from the previous login is invalidated.
 * Unlike the other queue helpers this rejects on failure: callers await it
 * before signing a new account in, and stale data must not survive silently.
 */
export function clearPersistedLocalData(): Promise<void> {
  persistenceGeneration += 1
  const clear = saveQueue
    .catch(() => undefined)
    .then(() => replicaStorage.clear())
  saveQueue = clear.catch(error =>
    console.error('Failed to clear local replica data', error)
  )
  return clear
}

/** Replaces an unreadable durable outbox only after the user explicitly
 * confirms that those local commands may be discarded. */
export function discardPersistedOutbox(): Promise<void> {
  const generation = persistenceGeneration
  const discard = saveQueue
    .catch(() => undefined)
    .then(async () => {
      if (generation !== persistenceGeneration) return
      await replicaStorage.discardOutbox()
    })
  saveQueue = discard.catch(error =>
    console.error('Failed to discard corrupt replica outbox', error)
  )
  return discard
}

/** Persists a full snapshot already fetched for journal recovery. This is
 * separate from the normal middleware path because that path correctly stood
 * down while the raw corrupt outbox was quarantined. */
export function persistRecoveryCheckpoint(snapshot: TDataStore): Promise<void> {
  const generation = persistenceGeneration
  const recovery = saveQueue
    .catch(() => undefined)
    .then(async () => {
      if (generation !== persistenceGeneration) return
      await replicaStorage.commitCanonical({
        before: snapshot,
        after: snapshot,
        outbox: [],
        pushed: false,
        checkpointReason: 'recovery',
      })
      await replicaStorage
        .compactOneBatch()
        .catch(error =>
          console.warn('Failed to compact recovered replica history', error)
        )
    })
  saveQueue = recovery.catch(error =>
    console.error('Failed to persist recovered replica', error)
  )
  return recovery
}

/**
 * Runs one retention pass at startup. Never rejects: retention is secondary to
 * having a replica at all, so a failure here only postpones compaction.
 */
export function compactPersistedReplica(): Promise<void> {
  const generation = persistenceGeneration
  saveQueue = saveQueue
    .catch(() => undefined)
    .then(async () => {
      if (generation !== persistenceGeneration) return
      await replicaStorage.compactOneBatch()
    })
    .catch(error =>
      console.warn('Failed to compact replica history at startup', error)
    )
  return saveQueue.then(() => undefined)
}

/** Read barrier for history: a selected point is checked only after the
 * canonical commit and its bounded retention pass have both settled. */
export function waitForPersistedReplica(): Promise<void> {
  return saveQueue.catch(() => undefined).then(() => undefined)
}

export function resetReplicaPersistenceForTests(): void {
  saveQueue = Promise.resolve()
  persistenceGeneration = 0
  primaryWritesDisabled = false
}

function enqueuePrimary(
  dispatch: (action: ReturnType<typeof persistenceFailed>) => unknown,
  write: () => Promise<unknown>
): void {
  const generation = persistenceGeneration
  saveQueue = saveQueue
    .catch(() => undefined)
    .then(async () => {
      if (generation !== persistenceGeneration || primaryWritesDisabled) return
      await write()
    })
    .catch(error => {
      if (generation !== persistenceGeneration || primaryWritesDisabled) return
      primaryWritesDisabled = true
      const reason = error instanceof Error ? error.message : String(error)
      console.error('Failed to persist Core replica', error)
      dispatch(persistenceFailed({ reason }))
    })
}

function isOutboxMutation(action: unknown): boolean {
  return (
    appendClientCommand.match(action) ||
    undoClientCommand.match(action) ||
    redoClientCommand.match(action) ||
    restoreOutboxPosition.match(action)
  )
}
