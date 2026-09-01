import { getSyncCursor } from 'store/data/selectors'
import { getToken } from 'store/token'
import { track } from '6-shared/analytics'
import {
  syncFinished,
  syncStarted,
  syncStatusChanged,
  type TSyncStatus,
} from 'store/sync'
import { formatDate } from '6-shared/helpers/date'
import type { AppThunk, RootState } from 'store'
import { sync } from '6-shared/api/syncDiff'
import {
  applyPushChunk,
  applyServerPatch,
  prepareClientSync,
  waitForPersistedReplica,
} from 'store/data'
import type { TNormalizedPatch } from '6-shared/types'
import { measureRequestBytes } from '6-shared/api/zm-adapter'
import { zmPreferenceStorage } from '6-shared/api/zmPreferenceStorage'
import { refreshSelectedHistoryPoint } from 'store/history'
import {
  beginPush,
  DEFAULT_PUSH_MAX_BYTES,
  drivePush,
  type TPushDriverPorts,
  type TPushEvent,
  type TPushOutcome,
  type TPushProgressRow,
} from 'zerro-core/replica'

type TSyncRuntime = {
  now?: () => number
  sleep?: (milliseconds: number) => Promise<void>
  /** Carried across a stop by the stopped state; halved by an HTTP 413. */
  maxBytes?: number
}

/** Pushes the captured Outbox through one or more bounded requests. */
export const syncData =
  (runtime: TSyncRuntime = {}): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    if (syncIsBlocked(getState())) return
    dispatch(prepareClientSync())
    const state = getState()
    const sentAt = now(runtime)
    const maxBytes = runtime.maxBytes ?? DEFAULT_PUSH_MAX_BYTES
    const prepared = beginPush(state.data, sentAt, {
      maxBytes,
      measure: measureRequestBytes,
    })

    // An empty Outbox still performs the existing explicit refresh. This is
    // how a freshly authenticated replica gets its first canonical snapshot.
    if (!prepared) {
      if (state.data.outbox.length) {
        dispatch(
          syncFinished(
            failedResult(sentAt, 'Pending changes produced no request')
          )
        )
        return
      }
      await dispatch(exchangeWithoutPush({ runtime }))
      return
    }

    dispatch(
      syncStatusChanged({
        status: sendingStatus(prepared.progress),
        openDetails: prepared.run.multiChunk,
      })
    )

    let outcome: TPushOutcome
    try {
      outcome = await drivePush(
        prepared,
        pushPorts(dispatch, getState, runtime)
      )
    } catch (error) {
      // Nothing may leave the slice mid-push: a status that never returns to
      // rest blocks every later sync until the page is reloaded.
      console.error('Syncing failed', error)
      dispatch(syncFinished(failedResult(now(runtime), getErrorMessage(error))))
      return
    }

    if (outcome.kind === 'done') {
      track('sync_completed', { mode: 'update' })
      console.log(`✅ Data synced ${formatDate(new Date(), 'HH:mm:ss')}`)
      dispatch(syncFinished(successResult(now(runtime))))
      return
    }
    if (outcome.kind === 'abandoned') {
      console.warn('Syncing failed', outcome.message)
      dispatch(syncFinished(failedResult(now(runtime), outcome.message)))
      return
    }
    console.warn('Syncing failed', outcome.message)

    // A one-request run that delivered nothing leaves the outbox exactly as
    // it was, so there is no partial delivery to decide about. Parking that in
    // `stopped` would keep undo, redo and background pull switched off behind
    // a dialog nothing opened — which an ordinary offline blip must not do.
    if (!outcome.multiChunk && !outcome.acceptedChunks) {
      dispatch(syncFinished(failedResult(now(runtime), stopMessage(outcome))))
      return
    }

    // A stop is the one state that needs the user, so it always shows itself,
    // including after a 413 turned a one-request run into a multi-Chunk one.
    dispatch(
      syncStatusChanged({
        openDetails: true,
        status: {
          kind: 'stopped',
          rows: outcome.progress,
          errorMessage: stopMessage(outcome),
          errorStatus: outcome.status ?? null,
          maxBytes: outcome.maxBytes,
        },
      })
    )
  }

function stopMessage(outcome: Extract<TPushOutcome, { kind: 'stopped' }>) {
  return outcome.itemTooLarge
    ? 'One sync item is too large for ZenMoney'
    : outcome.message
}

/**
 * Retries a stopped run. The outbox already holds the unconfirmed remainder as
 * one command, so this is an ordinary push — the same thing a reload would do,
 * carrying only the byte limit an HTTP 413 established.
 */
export const retryStoppedSync =
  (runtime: TSyncRuntime = {}): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const status = getState().sync.status
    if (status.kind !== 'stopped') return
    await dispatch(syncData({ ...runtime, maxBytes: status.maxBytes }))
  }

/** Leaves every unconfirmed item pending and closes the stopped dialog. */
export const continueSyncLater =
  (runtime: TSyncRuntime = {}): AppThunk =>
  (dispatch, getState) => {
    const status = getState().sync.status
    const message =
      status.kind === 'stopped' ? status.errorMessage : 'Sync stopped'
    dispatch(syncFinished(failedResult(now(runtime), message)))
  }

/**
 * Pulls the canonical diff without pushing anything. Background sync uses
 * this, so an idle tab stays current without acknowledging local commands.
 */
export const refreshData = (): AppThunk =>
  exchangeWithoutPush({ fullReload: false })

/** Pulls a complete server snapshot and appends a canonical checkpoint. */
export const reloadData = (): AppThunk =>
  exchangeWithoutPush({ fullReload: true })

/**
 * The browser's half of a Push run: HTTP, Redux, durable storage and the
 * progress surface. Ordering, packing and retry policy stay in Core.
 */
function pushPorts(
  dispatch: Parameters<AppThunk>[0],
  getState: Parameters<AppThunk>[1],
  runtime: TSyncRuntime
): TPushDriverPorts {
  return {
    now: () => now(runtime),
    sleep: milliseconds => sleep(runtime, milliseconds),
    readReplica: () => getState().data,
    send: async request => {
      const response = await sync(
        getToken(getState()) || '',
        zmPreferenceStorage.get(),
        request
      )
      if (response.data) return { ok: true, patch: response.data }
      return {
        ok: false,
        message: response.error,
        status: response.status,
        retryAfterMs: response.retryAfterMs,
      }
    },
    commit: async ({ accepted }) => {
      dispatch(applyPushChunk(accepted))
      await waitForPersistedReplica()
      if (getState().data.persistenceWarning) {
        // The server has already accepted this chunk and Redux has already
        // advanced past it. Retrying from here could resend work the client
        // now considers confirmed; the global persistence warning owns
        // recovery from this point.
        return { ok: false, message: 'Accepted sync data could not be stored' }
      }
      await dispatch(refreshSelectedHistoryPoint())
      return { ok: true }
    },
    report: event => {
      if (event.type === 'done') return
      dispatch(syncStatusChanged({ status: statusOfEvent(event) }))
    },
  }
}

function statusOfEvent(
  event: Exclude<TPushEvent, { type: 'done' }>
): TSyncStatus {
  if (event.type === 'sending') return sendingStatus(event.progress)
  if (event.type === 'waiting') {
    return {
      kind: 'pushing',
      phase: 'waiting',
      rows: event.progress,
      retryAt: event.retryAt,
      errorMessage: event.message,
      errorStatus: event.status ?? null,
    }
  }
  // A stop is decided by the outcome, which knows whether a retry is on
  // offer; the event only says the driver stopped sending.
  return sendingStatus(event.progress)
}

function sendingStatus(rows: TPushProgressRow[]): TSyncStatus {
  return {
    kind: 'pushing',
    phase: 'sending',
    rows,
    retryAt: null,
    errorMessage: null,
    errorStatus: null,
  }
}

function exchangeWithoutPush(
  options: { fullReload?: boolean; runtime?: TSyncRuntime } = {}
): AppThunk<Promise<void>> {
  return async (dispatch, getState) => {
    const runtime = options.runtime ?? {}
    const fullReload = options.fullReload ?? false
    const state = getState()
    const { journalRecoveryRequired, outboxRecoveryReason } = state.data
    if (
      state.sync.status.kind !== 'idle' ||
      outboxRecoveryReason !== null ||
      (journalRecoveryRequired && !fullReload)
    )
      return

    const diff: TNormalizedPatch = {
      serverTimestamp: fullReload ? 0 : getSyncCursor(getState()),
    }
    dispatch(syncStarted())
    try {
      const response = await sync(
        getToken(getState()) || '',
        zmPreferenceStorage.get(),
        diff
      )
      if (!response.data) {
        dispatch(syncFinished(failedResult(now(runtime), response.error)))
        return
      }
      dispatch(
        applyServerPatch({
          ...response.data,
          ...(fullReload ? { fullReload: true } : {}),
        })
      )
      await dispatch(refreshSelectedHistoryPoint())
      track('sync_completed', { mode: fullReload ? 'update' : 'pull' })
      console.log(`✅ Data synced ${formatDate(new Date(), 'HH:mm:ss')}`)
      dispatch(syncFinished(successResult(now(runtime))))
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      console.error('Syncing failed', error)
      dispatch(syncFinished(failedResult(now(runtime), errorMessage)))
    }
  }
}

/** A new run may start from rest or from a stop, but never mid-flight. */
function syncIsBlocked(state: RootState): boolean {
  const kind = state.sync.status.kind
  return (
    kind === 'pulling' ||
    kind === 'pushing' ||
    state.data.outboxRecoveryReason !== null ||
    state.data.journalRecoveryRequired
  )
}

function now(runtime: TSyncRuntime): number {
  return runtime.now?.() ?? Date.now()
}

function sleep(runtime: TSyncRuntime, milliseconds: number): Promise<void> {
  if (runtime.sleep) return runtime.sleep(milliseconds)
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function successResult(finishedAt: number) {
  return { isSuccessful: true, finishedAt, errorMessage: null }
}

function failedResult(finishedAt: number, errorMessage: string) {
  return { isSuccessful: false, finishedAt, errorMessage }
}

function getErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.slice(0, 500) || 'Unknown sync failure'
}
