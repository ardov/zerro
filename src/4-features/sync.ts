import { getSyncCursor } from 'store/data/selectors'
import { getToken } from 'store/token'
import { track } from '6-shared/analytics'
import { syncFinished, syncStarted } from 'store/sync'
import { formatDate } from '6-shared/helpers/date'
import type { AppThunk } from 'store'
import { sync } from '6-shared/api/syncDiff'
import {
  getPendingSyncTransport,
  applyServerPatch,
  prepareClientSync,
} from 'store/data'
import type { TNormalizedPatch } from '6-shared/types'
import { zmPreferenceStorage } from '6-shared/api/zmPreferenceStorage'
import { refreshSelectedHistoryPoint } from 'store/history'

/**
 * All exchanges with ZenMoney go through this thunk.
 *
 * `push` is the whole difference between the two modes. A push acknowledges the
 * sent outbox prefix, which is why it may only ever be a deliberate user
 * action: dropping that prefix destroys the undo history the user still expects
 * to have. A pull sends no entities and acknowledges nothing, so pending
 * commands rebase over the new base and stay undoable.
 */
const exchangeWithZenmoney =
  ({
    push,
    fullReload = false,
  }: {
    push: boolean
    fullReload?: boolean
  }): AppThunk =>
  async (dispatch, getState) => {
    // Narrower than `getReplicaWriteBlocked`: a full reload is exactly how
    // journal recovery ends, so it is the one exchange allowed to run during
    // it. A corrupt outbox blocks every exchange until the user discards it.
    // Both states already show a persistent notice, so returning is silent by
    // design — there is nothing this thunk could add.
    const { journalRecoveryRequired, outboxRecoveryReason } = getState().data
    if (
      outboxRecoveryReason !== null ||
      (journalRecoveryRequired && !fullReload)
    )
      return
    if (push) dispatch(prepareClientSync())
    const state = getState()
    const sentOutboxCount = push ? state.data.outbox.length : 0
    const sentAt = Date.now()
    const diff: TNormalizedPatch = {
      ...(push ? getPendingSyncTransport(state, sentAt) : undefined),
      serverTimestamp: fullReload ? 0 : getSyncCursor(state),
    }
    const token = getToken(state) || ''

    dispatch(syncStarted())

    try {
      const response = await sync(token, zmPreferenceStorage.get(), diff)
      const result = {
        isSuccessful: !response.error,
        finishedAt: Date.now(),
        errorMessage: response.error || null,
      }

      if (response.data) {
        const data = response.data
        dispatch(
          applyServerPatch({
            ...data,
            sentOutboxCount,
            push,
            ...(fullReload ? { fullReload: true } : {}),
          })
        )
        await dispatch(refreshSelectedHistoryPoint())
        track('sync_completed', {
          mode: fullReload
            ? 'update'
            : !push
              ? 'pull'
              : diff.serverTimestamp
                ? 'update'
                : 'first',
        })
        console.log(`✅ Data synced ${formatDate(new Date(), 'HH:mm:ss')}`)
      } else {
        console.warn('Syncing failed', response.error)
      }

      dispatch(syncFinished(result))
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      console.error('Syncing failed', error)
      dispatch(
        syncFinished({
          isSuccessful: false,
          finishedAt: Date.now(),
          errorMessage,
        })
      )
    }
  }

/** Pushes the pending outbox and applies the canonical response. */
export const syncData = (): AppThunk => exchangeWithZenmoney({ push: true })

/**
 * Pulls the canonical diff without pushing anything. Background sync uses this,
 * so an idle tab stays current without silently acknowledging — and thereby
 * discarding — changes the user never chose to send.
 */
export const refreshData = (): AppThunk => exchangeWithZenmoney({ push: false })

/** Pulls a complete server snapshot and appends a canonical checkpoint. */
export const reloadData = (): AppThunk =>
  exchangeWithZenmoney({ push: false, fullReload: true })

function getErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.slice(0, 500) || 'Unknown sync failure'
}
