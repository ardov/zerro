import type { TZmDiff } from '6-shared/types'
import { convertDiff } from '6-shared/api/zm-adapter/converters'
import { acceptCanonicalPatch, getSyncCursor } from 'zerro-core/headless'

import type { TToolContext } from './context'
import { ToolError, success } from './output'
import { exchangeDiff, type TZenMoneyDependencies } from '../adapters/zenmoney'
import {
  loadWorkspace,
  saveWorkspace,
  stateRevision,
  workspaceMeta,
} from '../adapters/stateFile'

export async function refresh(
  context: TToolContext,
  dependencies: TZenMoneyDependencies = { fetch, now: context.now }
) {
  const command = 'refresh'
  const token = context.env.ZM_TOKEN
  if (!token)
    throw new ToolError(
      command,
      'local',
      'TOKEN_REQUIRED',
      'ZM_TOKEN is required for refresh',
      4
    )
  const workspace = await loadWorkspace(context, command)
  const cursorMs = getSyncCursor(workspace.state.base.serverTimestamp)
  const response = await exchangeDiff(
    {
      endpoint: workspace.state.endpoint,
      token,
      diff: convertDiff.toServer({
        serverTimestamp: cursorMs,
      }) as TZmDiff,
    },
    dependencies
  )
  let canonicalPatch
  try {
    canonicalPatch = convertDiff.toClient(response)
  } catch {
    throw new ToolError(
      command,
      'local',
      'INVALID_ZENMONEY_RESPONSE',
      'ZenMoney diff could not be normalized',
      6,
      undefined,
      'not_applied',
      true
    )
  }
  const accepted = acceptCanonicalPatch(
    { base: workspace.state.base, outbox: workspace.state.outbox },
    canonicalPatch
  )
  const state = {
    ...workspace.state,
    base: accepted.base,
    outbox: accepted.outbox,
  }
  await saveWorkspace(workspace.path, state, command)
  const refreshed = {
    ...workspace,
    exists: true,
    state,
    current: accepted.current,
    revision: stateRevision(state),
  }
  return success(command, 'local', workspaceMeta(refreshed, context.now()), {
    cursorMs,
    receivedServerTimestampMs: accepted.base.serverTimestamp,
    changed: changedCounts(canonicalPatch),
    pendingCommandCount: accepted.outbox.length,
  })
}

function changedCounts(patch: ReturnType<typeof convertDiff.toClient>) {
  return Object.fromEntries(
    Object.entries(patch)
      .filter(([key]) => key !== 'serverTimestamp')
      .map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])
  )
}
