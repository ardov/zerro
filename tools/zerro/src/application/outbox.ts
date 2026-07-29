import { undoOutbox, type TCommand } from 'zerro-core/headless'

import type { TToolContext } from './context'
import { ToolError, success } from './output'
import { page, parseLimit } from './pagination'
import type { TReadOptions } from './reads'
import {
  addRecentRequest,
  findRecentRequest,
  loadWorkspace,
  saveWorkspace,
  workspaceMeta,
} from '../adapters/stateFile'

export async function listOutbox(context: TToolContext, options: TReadOptions) {
  const command = 'outbox list'
  const workspace = await loadWorkspace(context, command)
  const limit = parseLimit(options.limit, command)
  const items = workspace.state.outbox.map((entry, index) =>
    presentOutboxCommand(entry, index)
  )
  return success(
    command,
    'none',
    workspaceMeta(workspace, context.now()),
    page(items, {
      command,
      revision: workspace.revision,
      query: {},
      limit,
      cursor: options.cursor,
    })
  )
}

export async function undoLastOutboxCommand(
  context: TToolContext,
  requestId: string
) {
  const command = 'outbox undo'
  const workspace = await loadWorkspace(context, command)
  const existing = findRecentRequest(workspace.state, {
    requestId,
    command,
    normalizedInput: {},
  })
  if (existing)
    return success(command, 'local', workspaceMeta(workspace, context.now()), {
      requestId,
      idempotent: true,
      receipt: existing.receipt,
    })
  const last = workspace.state.outbox.at(-1)
  if (!last)
    throw new ToolError(
      command,
      'none',
      'OUTBOX_EMPTY',
      'There is no staged command to undo',
      3
    )
  const outbox = undoOutbox(workspace.state.outbox, []).outbox
  const receipt = {
    undoneOutboxPosition: workspace.state.outbox.length,
    remainingCommandCount: outbox.length,
  }
  const next = addRecentRequest(
    { ...workspace.state, outbox },
    {
      requestId,
      command,
      normalizedInput: {},
      completedAt: context.now(),
      receipt,
    }
  )
  await saveWorkspace(context.statePath, next, command)
  const saved = await loadWorkspace(context, command)
  return success(command, 'local', workspaceMeta(saved, context.now()), {
    requestId,
    idempotent: false,
    receipt,
    undone: presentOutboxCommand(last, workspace.state.outbox.length - 1),
  })
}

function presentOutboxCommand(command: TCommand, index: number) {
  const touched = Object.entries(command.patch).flatMap(
    ([entityType, rows]) => {
      if (!Array.isArray(rows)) return []
      if (entityType === 'deletion') {
        const ids = rows
          .flatMap(row => {
            const record: unknown = row
            if (!isRecord(record) || typeof record.id !== 'string') return []
            return [`${String(record.object)}:${record.id}`]
          })
          .slice(0, 20)
        return ids.length
          ? [{ entityType: 'deletion', entityIds: ids, count: rows.length }]
          : []
      }
      const ids = rows
        .flatMap(row => {
          if (!isRecord(row)) return []
          const id = row.id
          return typeof id === 'string' || typeof id === 'number'
            ? [String(id)]
            : []
        })
        .slice(0, 20)
      return ids.length
        ? [{ entityType, entityIds: ids, count: rows.length }]
        : []
    }
  )
  return {
    position: index + 1,
    issuedAt: new Date(command.issuedAt).toISOString(),
    summary: summarize(touched.map(item => item.entityType)),
    touched,
  }
}

function summarize(entityTypes: readonly string[]): string {
  if (entityTypes.includes('transaction')) return 'transaction creation'
  if (entityTypes.includes('budget') || entityTypes.includes('reminder'))
    return 'budget update'
  return entityTypes.length ? 'entity update' : 'empty entity update'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
