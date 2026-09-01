import type { TNormalizedPatch, TZmDiff } from '6-shared/types'
import { convertDiff } from '6-shared/api/zm-adapter/converters'
import {
  beginPush,
  drivePush,
  getSyncCursor,
  replayOutbox,
  type TPushOutcome,
  type TPushSendResult,
} from 'zerro-core/headless'
import { measureRequestBytes } from '6-shared/api/zm-adapter'

import type { TEndpoint, TToolContext } from './context'
import { ToolError, success, type TWarning } from './output'
import { exchangeDiff, type TZenMoneyDependencies } from '../adapters/zenmoney'

import {
  loadWorkspace,
  saveWorkspace,
  stateRevision,
  workspaceMeta,
} from '../adapters/stateFile'

const wait = (milliseconds: number) =>
  new Promise<void>(resolve => setTimeout(resolve, milliseconds))

export async function sync(
  context: TToolContext,
  dependencies: TZenMoneyDependencies & { pushMaxBytes?: number } = {
    fetch,
    now: context.now,
  }
) {
  const command = 'sync'
  const workspace = await loadWorkspace(context, command)
  if (!workspace.state.outbox.length)
    return success(command, 'remote', workspaceMeta(workspace, context.now()), {
      sentOutboxCount: 0,
      cursorMs: getSyncCursor(workspace.state.base.serverTimestamp),
      receivedServerTimestampMs: workspace.state.base.serverTimestamp,
      pendingCommandCount: 0,
      noOp: true,
    })

  const token = context.env.ZM_TOKEN
  if (!token)
    throw new ToolError(
      command,
      'remote',
      'TOKEN_REQUIRED',
      'ZM_TOKEN is required for sync',
      4
    )
  const sentOutboxCount = workspace.state.outbox.length
  const sentAt = context.now()
  const prepared = beginPush(workspace.state, sentAt, {
    ...(dependencies.pushMaxBytes
      ? { maxBytes: dependencies.pushMaxBytes }
      : {}),
    measure: measureRequestBytes,
  })
  if (!prepared)
    throw new ToolError(
      command,
      'local',
      'OUTBOX_NO_TRANSPORT',
      'Staged commands produced no transport patch',
      5
    )
  const cursorMs = getSyncCursor(workspace.state.base.serverTimestamp)
  let state = workspace.state
  const warnings: TWarning[] = []

  const outcome = await drivePush(prepared, {
    now: context.now,
    // A partial dependencies object must not silently turn backoff into a
    // busy loop, so the default is a real wait rather than nothing.
    sleep: milliseconds => (dependencies.sleep ?? wait)(milliseconds),
    readReplica: () => state,
    send: request => exchange(state.endpoint, token, request, dependencies),
    // A save failure is fatal on purpose: the CLI has nowhere to keep an
    // accepted chunk it could not write, so the error reaches the caller.
    commit: async ({ prepared: sent, accepted, canonicalPatch }) => {
      warnings.push(
        ...(missingCanonicalTransactions(sent.request, canonicalPatch) ?? [])
      )
      state = { ...state, base: accepted.base, outbox: accepted.outbox }
      await saveWorkspace(workspace.path, state, command)
      return { ok: true }
    },
  })

  if (outcome.kind !== 'done') throw syncFailure(outcome)

  const synced = {
    ...workspace,
    exists: true,
    state,
    current: replayOutbox(state.base, state.outbox),
    revision: stateRevision(state),
  }
  return success(
    command,
    'remote',
    workspaceMeta(synced, context.now()),
    {
      sentOutboxCount,
      cursorMs,
      receivedServerTimestampMs: state.base.serverTimestamp,
      pendingCommandCount: state.outbox.length,
      noOp: false,
    },
    warnings
  )
}

/** One request, with every failure expressed as a result the driver reads. */
async function exchange(
  endpoint: TEndpoint,
  token: string,
  request: TNormalizedPatch,
  dependencies: TZenMoneyDependencies
): Promise<TPushSendResult> {
  let response: TZmDiff
  try {
    response = await exchangeDiff(
      { endpoint, token, diff: convertDiff.toServer(request) as TZmDiff },
      dependencies,
      'sync'
    )
  } catch (error) {
    if (!(error instanceof ToolError)) {
      return {
        ok: false,
        message: String(error),
        retryable: false,
        cause: error,
      }
    }
    const status = error.details?.httpStatus
    return {
      ok: false,
      message: error.message,
      status: typeof status === 'number' ? status : undefined,
      retryAfterMs:
        typeof error.details?.retryAfterMs === 'number'
          ? error.details.retryAfterMs
          : undefined,
      // A request that never reached the server has no status to judge.
      ...(error.code === 'NETWORK_FAILURE' ? { retryable: true } : {}),
      cause: error,
    }
  }

  try {
    return { ok: true, patch: convertDiff.toClient(response) }
  } catch {
    return {
      ok: false,
      message: 'ZenMoney sync response could not be normalized',
      retryable: false,
      cause: new ToolError(
        'sync',
        'remote',
        'INVALID_ZENMONEY_RESPONSE',
        'ZenMoney sync response could not be normalized',
        6,
        undefined,
        'unknown',
        false
      ),
    }
  }
}

function syncFailure(
  outcome: Exclude<TPushOutcome, { kind: 'done' }>
): ToolError {
  if (outcome.kind === 'stopped' && outcome.itemTooLarge) {
    return new ToolError(
      'sync',
      'remote',
      'SYNC_ITEM_TOO_LARGE',
      'One sync item exceeds the ZenMoney request limit',
      6,
      { httpStatus: 413 },
      'not_applied',
      false
    )
  }
  if (outcome.kind === 'stopped' && outcome.cause instanceof ToolError) {
    return outcome.cause
  }
  return new ToolError(
    'sync',
    'remote',
    'SYNC_FAILED',
    outcome.message,
    6,
    undefined,
    'unknown',
    false
  )
}

function missingCanonicalTransactions(
  transport: TNormalizedPatch,
  canonicalPatch: ReturnType<typeof convertDiff.toClient>
): TWarning[] | undefined {
  const sent = transport?.transaction?.map(transaction => transaction.id) ?? []
  const returned = new Set(
    canonicalPatch.transaction?.map(transaction => transaction.id) ?? []
  )
  const missing = sent.filter(id => !returned.has(id)).slice(0, 20)
  if (!missing.length) return undefined
  return [
    {
      code: 'CANONICAL_TRANSACTION_MISSING',
      message:
        'ZenMoney accepted the outbox prefix without returning every staged transaction',
      entityIds: missing,
    },
  ]
}
