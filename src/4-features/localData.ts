import type { AppThunk } from '@/store'
import { captureError } from '@/6-shared/diagnostics'
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
} from '@/store/data'
import {
  replicaStorage,
  type TRecoveryReplica,
} from '@/6-shared/api/replicaStorage'
import { getRootUserId, validateDataStore } from '@/zerro-core/replica'

export const loadLocalData = (): AppThunk => async dispatch => {
  // Only hydration decides recovery. Retention runs after it and outside this
  // `try` on purpose: a failed compaction must never be mistaken for a corrupt
  // replica and send the user through a full reload.
  try {
    const loaded = await replicaStorage.loadCurrent()
    if (!loaded) return
    if (loaded.outbox.status === 'corrupt') {
      reportLocalRecovery('outbox', loaded.outbox.reason)
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
    reportLocalRecovery('journal', reason)
    let recovery: TRecoveryReplica | null
    try {
      recovery = await replicaStorage.loadOutboxForRecovery()
    } catch (outboxError) {
      console.warn('Could not preserve the persisted outbox', outboxError)
      const outboxReason =
        outboxError instanceof Error ? outboxError.message : String(outboxError)
      reportLocalRecovery('outbox', outboxReason)
      dispatch(
        hydrateCorruptReplica({
          rootUserId: null,
          journalReason: reason,
          outboxReason,
        })
      )
      return
    }
    if (recovery?.outbox.status === 'corrupt') {
      reportLocalRecovery('outbox', recovery.outbox.reason)
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
      const validation = validateDataStore(base)
      if (!validation.ok) {
        dispatch(
          hydrateRecoveryOutbox({
            rootUserId,
            outbox: [],
            reason: validation.reason,
          })
        )
        reportLocalRecovery('journal', validation.reason)
        return
      }
      await persistRecoveryCheckpoint(base)
      dispatch(recoveryCheckpointPersisted())
    }
  }

function reportLocalRecovery(kind: 'journal' | 'outbox', reason: string) {
  // Send the diagnostic only, never the snapshot or queued commands.
  captureError(new Error(`Local ${kind} recovery required: ${reason}`))
}
