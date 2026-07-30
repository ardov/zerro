import { randomUUID } from 'node:crypto'

import {
  compileSetBudget,
  createZerroSession,
  stageCompiledCommand,
} from 'zerro-core/headless'

import type { TToolContext } from './context'
import { ToolError, success } from './output'
import {
  addRecentRequest,
  findRecentRequest,
  loadWorkspace,
  saveWorkspace,
  workspaceMeta,
  type TWorkspace,
} from '../adapters/stateFile'

export type TSetEnvelopeBudgetsRequest = {
  month: string
  updates: TSetEnvelopeBudgetUpdate[]
}

export type TSetEnvelopeBudgetUpdate =
  | {
      envelopeId: string
      operation: 'set'
      amount: number
      currency: string
    }
  | {
      envelopeId: string
      operation: 'clear'
    }

type TValidatedUpdate = {
  envelopeId: string
  operation: 'set' | 'clear'
  amount: number
  currency: string
}

export function parseSetEnvelopeBudgetsRequest(
  value: unknown,
  command = 'budget preview-set'
): TSetEnvelopeBudgetsRequest {
  if (!isRecord(value)) invalidInput(command, 'Input must be an object')
  assertExactKeys(value, ['month', 'updates'], command, 'input')
  if (!isMonth(value.month)) invalidInput(command, 'month must use YYYY-MM')
  if (
    !Array.isArray(value.updates) ||
    !value.updates.length ||
    value.updates.length > 50
  )
    invalidInput(command, 'updates must contain from 1 to 50 items')

  const updates = value.updates.map((item, index) =>
    parseUpdate(item, index, command)
  )
  const duplicates = updates.find(
    (update, index) =>
      updates.findIndex(item => item.envelopeId === update.envelopeId) !== index
  )
  if (duplicates)
    invalidInput(command, 'updates must use unique envelopeId values', {
      envelopeId: duplicates.envelopeId,
    })
  return { month: value.month, updates }
}

export async function previewSetEnvelopeBudgets(
  context: TToolContext,
  request: TSetEnvelopeBudgetsRequest
) {
  const command = 'budget preview-set'
  const workspace = await loadWorkspace(context, command)
  const validated = validateRequest(context, workspace, request, command)
  const staged = stageBudgetCommand(
    workspace,
    request.month,
    validated,
    context.now(),
    () => `preview-${randomUUID()}`,
    command
  )
  return success(command, 'none', workspaceMeta(workspace, context.now()), {
    month: request.month,
    affected: formatAffectedEnvelopes(
      context,
      workspace.current,
      staged.current,
      request.month,
      validated
    ),
  })
}

export async function stageSetEnvelopeBudgets(
  context: TToolContext,
  requestId: string,
  request: TSetEnvelopeBudgetsRequest
) {
  const command = 'budget stage-set'
  const workspace = await loadWorkspace(context, command)
  const existing = findRecentRequest(workspace.state, {
    requestId,
    command,
    normalizedInput: request,
  })
  if (existing)
    return success(command, 'local', workspaceMeta(workspace, context.now()), {
      requestId,
      idempotent: true,
      receipt: existing.receipt,
    })

  const validated = validateRequest(context, workspace, request, command)
  const staged = stageBudgetCommand(
    workspace,
    request.month,
    validated,
    context.now(),
    randomUUID,
    command
  )
  const receipt = {
    outboxPosition: staged.outbox.length,
    affectedEnvelopeCount: validated.length,
  }
  const next = addRecentRequest(
    { ...workspace.state, outbox: staged.outbox },
    {
      requestId,
      command,
      normalizedInput: request,
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
    month: request.month,
    affected: formatAffectedEnvelopes(
      context,
      workspace.current,
      saved.current,
      request.month,
      validated
    ),
  })
}

function validateRequest(
  context: TToolContext,
  workspace: TWorkspace,
  request: TSetEnvelopeBudgetsRequest,
  command: string
): TValidatedUpdate[] {
  requireInitialized(workspace, command)
  const session = makeSession(context, workspace.current)
  if (!session.months.getList().includes(request.month as never))
    throw new ToolError(
      command,
      'none',
      'MONTH_NOT_FOUND',
      'Month is outside the available projection range',
      3,
      { month: request.month }
    )
  const envelopes = session.envelopes.getAll()
  return request.updates.map(update => {
    const envelope = envelopes[update.envelopeId as keyof typeof envelopes]
    if (!envelope)
      throw new ToolError(
        command,
        'none',
        'ENTITY_NOT_FOUND',
        'Envelope was not found',
        3,
        { envelopeId: update.envelopeId }
      )
    if (update.operation === 'clear')
      return {
        envelopeId: update.envelopeId,
        operation: 'clear',
        amount: 0,
        currency: envelope.currency,
      }
    if (update.currency !== envelope.currency)
      throw new ToolError(
        command,
        'none',
        'CURRENCY_MISMATCH',
        'Budget currency must match the envelope currency',
        2,
        {
          envelopeId: update.envelopeId,
          expectedCurrency: envelope.currency,
          requestedCurrency: update.currency,
        }
      )
    return {
      envelopeId: update.envelopeId,
      operation: 'set',
      amount: update.amount,
      currency: update.currency,
    }
  })
}

function stageBudgetCommand(
  workspace: TWorkspace,
  month: string,
  updates: readonly TValidatedUpdate[],
  issuedAt: number,
  uuid: () => string,
  command: string
) {
  try {
    return stageCompiledCommand(
      workspace.state.base,
      workspace.state.outbox,
      {
        patch: compileSetBudget(
          workspace.current,
          updates.map(update => ({
            id: update.envelopeId as never,
            month: month as never,
            value: update.amount,
          })),
          { now: () => issuedAt, uuid }
        ),
        receipt: undefined,
      },
      issuedAt
    )
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Compiled command did not change the snapshot'
    )
      throw new ToolError(
        command,
        'none',
        'NO_CHANGES',
        'Budget update does not change the current state',
        3
      )
    throw error
  }
}

function formatAffectedEnvelopes(
  context: TToolContext,
  before: TWorkspace['current'],
  after: TWorkspace['current'],
  month: string,
  updates: readonly TValidatedUpdate[]
) {
  const beforeSession = makeSession(context, before)
  const afterSession = makeSession(context, after)
  const beforeEnvelopes = beforeSession.envelopes.getAll()
  const afterEnvelopes = afterSession.envelopes.getAll()
  return updates.map(update => {
    const beforeEnvelope =
      beforeEnvelopes[update.envelopeId as keyof typeof beforeEnvelopes]
    const afterEnvelope =
      afterEnvelopes[update.envelopeId as keyof typeof afterEnvelopes]
    if (!beforeEnvelope || !afterEnvelope)
      throw new Error('Validated envelope disappeared while formatting')
    return {
      envelopeId: update.envelopeId,
      envelopeName: beforeEnvelope.name,
      currency: update.currency,
      operation: update.operation,
      before: assignedMetrics(
        beforeSession.envelopes.getMetrics()[
          month as keyof ReturnType<typeof beforeSession.envelopes.getMetrics>
        ]?.[update.envelopeId as never]
      ),
      after: assignedMetrics(
        afterSession.envelopes.getMetrics()[
          month as keyof ReturnType<typeof afterSession.envelopes.getMetrics>
        ]?.[update.envelopeId as never]
      ),
    }
  })
}

function assignedMetrics(
  metrics:
    | {
        selfAssigned: Record<string, number>
        totalAssigned: Record<string, number>
      }
    | undefined
) {
  if (!metrics) throw new Error('Envelope metrics are unavailable')
  return {
    selfAssignedByCurrency: metrics.selfAssigned,
    withChildrenAssignedByCurrency: metrics.totalAssigned,
  }
}

function makeSession(context: TToolContext, current: TWorkspace['current']) {
  return createZerroSession(current, {
    now: context.now,
    uuid: () => 'budget-read',
  })
}

function requireInitialized(workspace: TWorkspace, command: string): void {
  if (
    Object.keys(workspace.current.user).length &&
    Object.keys(workspace.current.instrument).length
  )
    return
  throw new ToolError(
    command,
    'none',
    'STATE_NOT_INITIALIZED',
    'Run refresh before reading or changing financial projections',
    4
  )
}

function parseUpdate(
  value: unknown,
  index: number,
  command: string
): TSetEnvelopeBudgetUpdate {
  if (!isRecord(value))
    invalidInput(command, `updates[${index}] must be an object`)
  if (typeof value.envelopeId !== 'string' || !value.envelopeId)
    invalidInput(
      command,
      `updates[${index}].envelopeId must be a non-empty string`
    )
  if (value.operation === 'clear') {
    assertExactKeys(
      value,
      ['envelopeId', 'operation'],
      command,
      `updates[${index}]`
    )
    return { envelopeId: value.envelopeId, operation: 'clear' }
  }
  if (value.operation !== 'set')
    invalidInput(
      command,
      `updates[${index}].operation must be "set" or "clear"`
    )
  assertExactKeys(
    value,
    ['envelopeId', 'operation', 'amount', 'currency'],
    command,
    `updates[${index}]`
  )
  if (
    typeof value.amount !== 'number' ||
    !Number.isFinite(value.amount) ||
    value.amount <= 0
  )
    invalidInput(
      command,
      `updates[${index}].amount must be a finite positive number`
    )
  if (typeof value.currency !== 'string' || !value.currency)
    invalidInput(
      command,
      `updates[${index}].currency must be a non-empty string`
    )
  return {
    envelopeId: value.envelopeId,
    operation: 'set',
    amount: value.amount,
    currency: value.currency,
  }
}

function isMonth(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
}

function assertExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  command: string,
  path: string
): void {
  const expected = new Set(keys)
  const invalid = Object.keys(value).find(key => !expected.has(key))
  const missing = keys.find(key => !(key in value))
  if (invalid || missing)
    invalidInput(
      command,
      `${path} has ${invalid ? `unknown key ${invalid}` : `missing key ${missing}`}`
    )
}

function invalidInput(
  command: string,
  message: string,
  details?: Record<string, string>
): never {
  throw new ToolError(command, 'none', 'INVALID_INPUT', message, 2, details)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
