import type { TZmDiff } from '6-shared/types'
import { convertDiff } from '6-shared/api/zm-adapter/converters'
import {
  acceptCanonicalPatch,
  buildOutboxTransport,
  getSyncCursor,
} from 'zerro-core/headless'

import type { TToolContext } from './context'
import { ToolError, success, type TWarning } from './output'
import { exchangeDiff, type TZenMoneyDependencies } from '../adapters/zenmoney'
import {
  loadWorkspace,
  saveWorkspace,
  stateRevision,
  workspaceMeta,
} from '../adapters/stateFile'

export async function sync(
  context: TToolContext,
  dependencies: TZenMoneyDependencies = { fetch, now: context.now }
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
  const transport = buildOutboxTransport(
    workspace.state.base,
    workspace.state.outbox,
    sentAt
  )
  if (!transport)
    throw new ToolError(
      command,
      'local',
      'OUTBOX_NO_TRANSPORT',
      'Staged commands produced no transport patch',
      5
    )
  const cursorMs = getSyncCursor(workspace.state.base.serverTimestamp)
  const response = await exchangeDiff(
    {
      endpoint: workspace.state.endpoint,
      token,
      diff: convertDiff.toServer({
        ...transport,
        serverTimestamp: cursorMs,
      }) as TZmDiff,
    },
    dependencies,
    'sync'
  )
  let canonicalPatch
  try {
    canonicalPatch = convertDiff.toClient(response)
  } catch {
    throw new ToolError(
      command,
      'remote',
      'INVALID_ZENMONEY_RESPONSE',
      'ZenMoney sync response could not be normalized',
      6,
      undefined,
      'unknown',
      false
    )
  }
  const accepted = acceptCanonicalPatch(
    { base: workspace.state.base, outbox: workspace.state.outbox },
    canonicalPatch,
    sentOutboxCount
  )
  const state = {
    ...workspace.state,
    base: accepted.base,
    outbox: accepted.outbox,
  }
  await saveWorkspace(workspace.path, state, command)
  const synced = {
    ...workspace,
    exists: true,
    state,
    current: accepted.current,
    revision: stateRevision(state),
  }
  return success(
    command,
    'remote',
    workspaceMeta(synced, context.now()),
    {
      sentOutboxCount,
      cursorMs,
      receivedServerTimestampMs: accepted.base.serverTimestamp,
      pendingCommandCount: accepted.outbox.length,
      noOp: false,
    },
    missingCanonicalTransactions(transport, canonicalPatch)
  )
}

function missingCanonicalTransactions(
  transport: ReturnType<typeof buildOutboxTransport>,
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
