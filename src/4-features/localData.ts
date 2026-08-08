import type { AppThunk } from 'store'
import {
  clearPersistedLocalData,
  compactPersistedReplica,
  corruptOutboxDiscarded,
  discardPersistedOutbox,
  hydrateCorruptOutbox,
  hydrateCorruptReplica,
  hydrateRecoveryOutbox,
  hydrateReplica,
  persistRecoveryCheckpoint,
  recoveryCheckpointPersisted,
} from 'store/data'
import {
  replicaStorage,
  type TRecoveryReplica,
} from '6-shared/api/replicaStorage'
import { getRootUserId } from 'zerro-core/replica'

export const loadLocalData = (): AppThunk => async dispatch => {
  // Only hydration decides recovery. Retention runs after it and outside this
  // `try` on purpose: a failed compaction must never be mistaken for a corrupt
  // replica and send the user through a full reload.
  try {
    const loaded = await replicaStorage.loadCurrent()
    if (!loaded) return
    if (loaded.outbox.status === 'corrupt') {
      dispatch(
        hydrateCorruptOutbox({
          rootUserId: loaded.rootUserId,
          base: loaded.base,
          reason: loaded.outbox.reason,
        })
      )
      return
    }
    dispatch(
      hydrateReplica({
        rootUserId: loaded.rootUserId,
        base: loaded.base,
        outbox: loaded.outbox.commands,
      })
    )
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    console.warn('[journal-recovery]', {
      source: 'indexeddb-journal',
      reason,
    })
    let recovery: TRecoveryReplica | null
    try {
      recovery = await replicaStorage.loadOutboxForRecovery()
    } catch (outboxError) {
      console.warn('Could not preserve the persisted outbox', outboxError)
      dispatch(
        hydrateCorruptReplica({
          rootUserId: null,
          journalReason: reason,
          outboxReason:
            outboxError instanceof Error
              ? outboxError.message
              : String(outboxError),
        })
      )
      return
    }
    if (recovery?.outbox.status === 'corrupt') {
      dispatch(
        hydrateCorruptReplica({
          rootUserId: recovery.rootUserId,
          journalReason: reason,
          outboxReason: recovery.outbox.reason,
        })
      )
      return
    }
    dispatch(
      hydrateRecoveryOutbox({
        rootUserId: recovery?.rootUserId ?? null,
        outbox: recovery?.outbox.commands ?? [],
        reason,
      })
    )
    return
  }
  await compactPersistedReplica()
}

export const clearLocalData = (): AppThunk<Promise<void>> => () =>
  clearPersistedLocalData()

export const discardCorruptOutbox =
  (): AppThunk<Promise<void>> => async (dispatch, getState) => {
    const { outboxRecoveryReason } = getState().data
    if (outboxRecoveryReason === null) return
    await discardPersistedOutbox()
    dispatch(corruptOutboxDiscarded())
    const { base, journalRecoveryRequired, rootUserId } = getState().data
    if (
      journalRecoveryRequired &&
      rootUserId !== null &&
      getRootUserId(base.user) === rootUserId
    ) {
      await persistRecoveryCheckpoint(base)
      dispatch(recoveryCheckpointPersisted())
    }
  }
