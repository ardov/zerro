import { randomUUID } from 'node:crypto'

import {
  compileCreateTransaction,
  stageCompiledCommand,
  type TCreateTransactionInput,
} from '@/zerro-core/headless'

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

type TTransactionDetails = {
  date: string
  comment?: string | null
}

type TCategorizedTransactionDetails = TTransactionDetails & {
  tagIds?: string[]
  merchantId?: string | null
  payee?: string | null
}

export type TCreateTransactionRequest =
  | (TCategorizedTransactionDetails & {
      kind: 'expense'
      accountId: string
      amount: number
    })
  | (TCategorizedTransactionDetails & {
      kind: 'income'
      accountId: string
      amount: number
    })
  | (TTransactionDetails & {
      kind: 'transfer'
      outcomeAccountId: string
      incomeAccountId: string
      outcome: number
      income?: number
    })

export function parseCreateTransactionRequest(
  value: unknown,
  command = 'transaction preview-create'
): TCreateTransactionRequest {
  if (!isRecord(value)) invalidInput(command, 'Input must be an object')
  if (value.kind === 'expense' || value.kind === 'income')
    return parseCategorizedRequest(value, command)
  if (value.kind === 'transfer') return parseTransferRequest(value, command)
  return invalidInput(
    command,
    'kind must be "expense", "income", or "transfer"'
  )
}

export async function previewCreateTransaction(
  context: TToolContext,
  request: TCreateTransactionRequest
) {
  const command = 'transaction preview-create'
  const workspace = await loadWorkspace(context, command)
  validateReferences(workspace, request, command)
  const staged = stageTransaction(
    workspace,
    request,
    context.now(),
    () => `preview-${randomUUID()}`,
    command
  )
  const transaction = staged.current.transaction[staged.receipt.transactionId]
  if (!transaction) throw new Error('Created transaction is missing')
  return success(command, 'none', workspaceMeta(workspace, context.now()), {
    before: null,
    after: presentTransaction(workspace, transaction, request.kind),
    balancePendingCanonicalSync: true,
  })
}

export async function stageCreateTransaction(
  context: TToolContext,
  requestId: string,
  request: TCreateTransactionRequest
) {
  const command = 'transaction stage-create'
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

  validateReferences(workspace, request, command)
  const staged = stageTransaction(
    workspace,
    request,
    context.now(),
    randomUUID,
    command
  )
  const receipt = {
    transactionId: staged.receipt.transactionId,
    outboxPosition: staged.outbox.length,
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
  const transaction = saved.current.transaction[staged.receipt.transactionId]
  if (!transaction) throw new Error('Staged transaction is missing')
  return success(command, 'local', workspaceMeta(saved, context.now()), {
    requestId,
    idempotent: false,
    receipt,
    before: null,
    after: presentTransaction(saved, transaction, request.kind),
  })
}

function stageTransaction(
  workspace: TWorkspace,
  request: TCreateTransactionRequest,
  issuedAt: number,
  uuid: () => string,
  command: string
) {
  try {
    return stageCompiledCommand(
      workspace.state.base,
      workspace.state.outbox,
      compileCreateTransaction(workspace.current, toCoreInput(request), {
        now: () => issuedAt,
        uuid,
      }),
      issuedAt
    )
  } catch (error) {
    if (!(error instanceof Error)) throw error
    if (error.message === 'Transfer accounts must be different')
      throw new ToolError(command, 'none', 'INVALID_INPUT', error.message, 2)
    if (
      error.message.includes('finite positive') ||
      error.message === 'Cross-instrument transfer requires income amount'
    )
      throw new ToolError(command, 'none', 'INVALID_INPUT', error.message, 2)
    throw error
  }
}

function toCoreInput(
  request: TCreateTransactionRequest
): TCreateTransactionInput {
  return request as TCreateTransactionInput
}

function validateReferences(
  workspace: TWorkspace,
  request: TCreateTransactionRequest,
  command: string
): void {
  requireInitialized(workspace, command)
  const accounts = workspace.current.account
  const requireAccount = (id: string, field: string) => {
    if (accounts[id]) return
    throw new ToolError(
      command,
      'none',
      'ENTITY_NOT_FOUND',
      'Account was not found',
      3,
      { field, accountId: id }
    )
  }
  if (request.kind === 'transfer') {
    requireAccount(request.outcomeAccountId, 'outcomeAccountId')
    requireAccount(request.incomeAccountId, 'incomeAccountId')
    return
  }
  requireAccount(request.accountId, 'accountId')
  request.tagIds?.forEach(tagId => {
    if (workspace.current.tag[tagId]) return
    throw new ToolError(
      command,
      'none',
      'ENTITY_NOT_FOUND',
      'Tag was not found',
      3,
      { tagId }
    )
  })
  if (request.merchantId && !workspace.current.merchant[request.merchantId])
    throw new ToolError(
      command,
      'none',
      'ENTITY_NOT_FOUND',
      'Merchant was not found',
      3,
      { merchantId: request.merchantId }
    )
}

function presentTransaction(
  workspace: TWorkspace,
  transaction: TWorkspace['current']['transaction'][string],
  kind: TCreateTransactionRequest['kind']
) {
  return {
    id: transaction.id,
    kind,
    date: transaction.date,
    income: moneySide(
      workspace,
      transaction.income,
      transaction.incomeAccount,
      transaction.incomeInstrument
    ),
    outcome: moneySide(
      workspace,
      transaction.outcome,
      transaction.outcomeAccount,
      transaction.outcomeInstrument
    ),
    tags: (transaction.tag ?? []).slice(0, 50).map(id => ({
      id,
      title: workspace.current.tag[id]?.title ?? '',
    })),
    tagCount: transaction.tag?.length ?? 0,
    merchant: transaction.merchant
      ? {
          id: transaction.merchant,
          title: workspace.current.merchant[transaction.merchant]?.title ?? '',
        }
      : null,
    payee: transaction.payee,
    comment: transaction.comment,
  }
}

function moneySide(
  workspace: TWorkspace,
  amount: number,
  // Null on a soft-deleted row whose leg an account deletion cleared.
  accountId: string | null,
  instrumentId: number
) {
  const account =
    accountId === null ? undefined : workspace.current.account[accountId]
  const instrument = workspace.current.instrument[instrumentId]
  return {
    amount,
    account: { id: accountId, title: account?.title ?? '' },
    instrument: {
      id: instrumentId,
      code: instrument?.shortTitle ?? '',
      symbol: instrument?.symbol ?? '',
    },
  }
}

function parseCategorizedRequest(
  value: Record<string, unknown>,
  command: string
): TCreateTransactionRequest {
  assertExactKeys(
    value,
    [
      'kind',
      'accountId',
      'amount',
      'date',
      'tagIds',
      'merchantId',
      'payee',
      'comment',
    ],
    ['kind', 'accountId', 'amount', 'date'],
    command,
    'input'
  )
  const kind = value.kind
  if (kind !== 'expense' && kind !== 'income')
    return invalidInput(command, 'kind must be "expense" or "income"')
  return {
    kind,
    accountId: requireId(value.accountId, 'accountId', command),
    amount: requirePositiveNumber(value.amount, 'amount', command),
    date: requireIsoDate(value.date, command),
    ...(value.tagIds === undefined
      ? {}
      : { tagIds: parseTagIds(value.tagIds, command) }),
    ...(value.merchantId === undefined
      ? {}
      : {
          merchantId: parseNullableId(value.merchantId, 'merchantId', command),
        }),
    ...(value.payee === undefined
      ? {}
      : { payee: parseNullableText(value.payee, 'payee', command) }),
    ...(value.comment === undefined
      ? {}
      : { comment: parseNullableText(value.comment, 'comment', command) }),
  }
}

function parseTransferRequest(
  value: Record<string, unknown>,
  command: string
): TCreateTransactionRequest {
  assertExactKeys(
    value,
    [
      'kind',
      'outcomeAccountId',
      'incomeAccountId',
      'outcome',
      'income',
      'date',
      'comment',
    ],
    ['kind', 'outcomeAccountId', 'incomeAccountId', 'outcome', 'date'],
    command,
    'input'
  )
  return {
    kind: 'transfer',
    outcomeAccountId: requireId(
      value.outcomeAccountId,
      'outcomeAccountId',
      command
    ),
    incomeAccountId: requireId(
      value.incomeAccountId,
      'incomeAccountId',
      command
    ),
    outcome: requirePositiveNumber(value.outcome, 'outcome', command),
    date: requireIsoDate(value.date, command),
    ...(value.income === undefined
      ? {}
      : { income: requirePositiveNumber(value.income, 'income', command) }),
    ...(value.comment === undefined
      ? {}
      : { comment: parseNullableText(value.comment, 'comment', command) }),
  }
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
    'Run refresh before creating transactions',
    4
  )
}

function assertExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  required: readonly string[],
  command: string,
  path: string
): void {
  const allowedKeys = new Set(allowed)
  const invalid = Object.keys(value).find(key => !allowedKeys.has(key))
  const missing = required.find(key => !(key in value))
  if (invalid || missing)
    invalidInput(
      command,
      `${path} has ${invalid ? `unknown key ${invalid}` : `missing key ${missing}`}`
    )
}

function requireId(value: unknown, field: string, command: string): string {
  if (typeof value === 'string' && value) return value
  return invalidInput(command, `${field} must be a non-empty string`)
}

function parseNullableId(
  value: unknown,
  field: string,
  command: string
): string | null {
  if (value === null) return null
  return requireId(value, field, command)
}

function parseNullableText(
  value: unknown,
  field: string,
  command: string
): string | null {
  if (value === null || typeof value === 'string') return value
  return invalidInput(command, `${field} must be a string or null`)
}

function parseTagIds(value: unknown, command: string): string[] {
  if (!Array.isArray(value) || value.length > 50)
    return invalidInput(command, 'tagIds must contain at most 50 ids')
  const tagIds = value.map(tagId => requireId(tagId, 'tagIds item', command))
  if (new Set(tagIds).size !== tagIds.length)
    return invalidInput(command, 'tagIds must not contain duplicates')
  return tagIds
}

function requirePositiveNumber(
  value: unknown,
  field: string,
  command: string
): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0)
    return value
  return invalidInput(command, `${field} must be a finite positive number`)
}

function requireIsoDate(value: unknown, command: string): string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value
  )
    return invalidInput(
      command,
      'date must use a valid YYYY-MM-DD calendar date'
    )
  return value
}

function invalidInput(command: string, message: string): never {
  throw new ToolError(command, 'none', 'INVALID_INPUT', message, 2)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
