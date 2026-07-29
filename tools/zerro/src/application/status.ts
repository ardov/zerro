import type { TToolContext } from './context'
import { success } from './output'
import { loadWorkspace, workspaceMeta } from '../adapters/stateFile'

export async function getStatus(context: TToolContext) {
  const workspace = await loadWorkspace(context, 'status')
  const last = workspace.state.outbox.at(-1)
  return success('status', 'none', workspaceMeta(workspace, context.now()), {
    stateExists: workspace.exists,
    endpoint: workspace.state.endpoint,
    statePath: workspace.path,
    stateRevision: workspace.revision,
    baseServerTimestampMs: workspace.state.base.serverTimestamp,
    accountCount: Object.keys(workspace.current.account).length,
    transactionCount: Object.keys(workspace.current.transaction).length,
    pendingCommandCount: workspace.state.outbox.length,
    lastCommandIssuedAt: last ? new Date(last.issuedAt).toISOString() : null,
    tokenAvailable: Boolean(context.env.ZERRO_TOKEN),
  })
}
