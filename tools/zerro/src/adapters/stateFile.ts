import { createHash, randomUUID } from 'node:crypto'
import {
  chmod,
  mkdir,
  open,
  readFile,
  rename,
  stat,
  unlink,
} from 'node:fs/promises'
import { dirname, basename, join } from 'node:path'

import {
  createEmptyDataStore,
  parseCommandOutbox,
  replayOutbox,
  type TCommand,
  type TDataStore,
} from 'zerro-core/headless'

import type { TEndpoint, TToolContext } from '../application/context'
import { ToolError, type TMeta } from '../application/output'

export type TReceiptValue = string | number | boolean | null

export type TRecentRequestReceipt = {
  requestId: string
  command: string
  inputHash: string
  completedAt: number
  receipt: Record<string, TReceiptValue>
}

export type TLocalToolState = {
  version: 1
  endpoint: TEndpoint
  base: TDataStore
  outbox: TCommand[]
  recentRequests: TRecentRequestReceipt[]
}

export type TWorkspace = {
  exists: boolean
  path: string
  state: TLocalToolState
  current: TDataStore
  revision: string
}

const dataKeys = [
  'instrument',
  'country',
  'company',
  'user',
  'merchant',
  'account',
  'tag',
  'budget',
  'reminder',
  'reminderMarker',
  'transaction',
] as const

export async function loadWorkspace(
  context: TToolContext,
  command: string
): Promise<TWorkspace> {
  let raw: string
  try {
    raw = await readFile(context.statePath, 'utf8')
  } catch (error) {
    if (hasCode(error, 'ENOENT')) {
      const state: TLocalToolState = {
        version: 1,
        endpoint: context.endpoint,
        base: createEmptyDataStore(),
        outbox: [],
        recentRequests: [],
      }
      return workspace(false, context.statePath, state, command)
    }
    throw localStateError(
      command,
      'STATE_READ_FAILED',
      'Cannot read state file'
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw localStateError(
      command,
      'INVALID_STATE',
      'State file is not valid JSON'
    )
  }

  const state = parseLocalToolState(parsed, command)
  if (context.endpointExplicit && state.endpoint !== context.endpoint)
    throw localStateError(
      command,
      'ENDPOINT_MISMATCH',
      'ZERRO_ENDPOINT conflicts with the persisted endpoint',
      { persistedEndpoint: state.endpoint, requestedEndpoint: context.endpoint }
    )
  return workspace(true, context.statePath, state, command)
}

export function parseLocalToolState(
  value: unknown,
  command = 'status'
): TLocalToolState {
  if (!isRecord(value))
    throw localStateError(command, 'INVALID_STATE', 'State must be an object')
  assertExactKeys(
    value,
    ['version', 'endpoint', 'base', 'outbox', 'recentRequests'],
    command,
    'state'
  )
  if (value.version !== 1)
    throw localStateError(
      command,
      'UNSUPPORTED_STATE_VERSION',
      'Unsupported state version'
    )
  if (value.endpoint !== 'ru' && value.endpoint !== 'app')
    throw localStateError(command, 'INVALID_STATE', 'State endpoint is invalid')
  const base = parseBase(value.base, command)
  let outbox: TCommand[]
  try {
    outbox = parseCommandOutbox(value.outbox)
  } catch (error) {
    throw localStateError(
      command,
      'INVALID_STATE',
      error instanceof Error ? error.message : 'State outbox is invalid'
    )
  }
  if (!Array.isArray(value.recentRequests) || value.recentRequests.length > 32)
    throw localStateError(
      command,
      'INVALID_STATE',
      'recentRequests must contain at most 32 receipts'
    )
  const recentRequests = value.recentRequests.map((item, index) =>
    parseReceipt(item, index, command)
  )
  return {
    version: 1,
    endpoint: value.endpoint,
    base,
    outbox,
    recentRequests,
  }
}

export async function saveWorkspace(
  path: string,
  state: TLocalToolState,
  command: string
): Promise<void> {
  const parent = dirname(path)
  const temporary = join(parent, `.${basename(path)}.${randomUUID()}.tmp`)
  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    let parentExisted = true
    try {
      await stat(parent)
    } catch (error) {
      if (!hasCode(error, 'ENOENT')) throw error
      parentExisted = false
    }
    await mkdir(parent, { recursive: true, mode: 0o700 })
    if (!parentExisted) await chmod(parent, 0o700)
    handle = await open(temporary, 'wx', 0o600)
    await handle.writeFile(`${JSON.stringify(state)}\n`, 'utf8')
    await handle.sync()
    await handle.close()
    handle = undefined
    await rename(temporary, path)
    await chmod(path, 0o600)
  } catch {
    await handle?.close().catch(() => undefined)
    await unlink(temporary).catch(() => undefined)
    throw localStateError(
      command,
      'STATE_WRITE_FAILED',
      'Cannot atomically save state'
    )
  }
}

export function stateRevision(state: TLocalToolState): string {
  return createHash('sha256')
    .update(
      canonicalJson({
        endpoint: state.endpoint,
        base: state.base,
        outbox: state.outbox,
      })
    )
    .digest('hex')
}

export function findRecentRequest(
  state: TLocalToolState,
  input: { requestId: string; command: string; normalizedInput: unknown }
): TRecentRequestReceipt | undefined {
  validateRequestId(input.requestId, input.command)
  const inputHash = hashInput(input.normalizedInput)
  const existing = state.recentRequests.find(
    receipt => receipt.requestId === input.requestId
  )
  if (!existing) return undefined
  if (existing.command === input.command && existing.inputHash === inputHash)
    return existing
  throw new ToolError(
    input.command,
    'local',
    'IDEMPOTENCY_CONFLICT',
    'Request id was already used for different input',
    5,
    { requestId: input.requestId }
  )
}

export function addRecentRequest(
  state: TLocalToolState,
  input: {
    requestId: string
    command: string
    normalizedInput: unknown
    completedAt: number
    receipt: Record<string, TReceiptValue>
  }
): TLocalToolState {
  validateRequestId(input.requestId, input.command)
  if (
    Object.values(input.receipt).some(value => !isReceiptValue(value)) ||
    !isFiniteNumber(input.completedAt)
  )
    throw new ToolError(
      input.command,
      'local',
      'INVALID_RECEIPT',
      'Request receipt is invalid',
      5
    )
  return {
    ...state,
    recentRequests: [
      ...state.recentRequests,
      {
        requestId: input.requestId,
        command: input.command,
        inputHash: hashInput(input.normalizedInput),
        completedAt: input.completedAt,
        receipt: input.receipt,
      },
    ].slice(-32),
  }
}

export function workspaceMeta(
  workspaceValue: TWorkspace,
  observedAt: number
): TMeta {
  return {
    observedAt: new Date(observedAt).toISOString(),
    baseServerTimestampMs: workspaceValue.state.base.serverTimestamp,
    stateRevision: workspaceValue.revision,
    pendingCommandCount: workspaceValue.state.outbox.length,
    balancePendingCanonicalSync: workspaceValue.state.outbox.length > 0,
  }
}

function workspace(
  exists: boolean,
  path: string,
  state: TLocalToolState,
  command: string
): TWorkspace {
  let current: TDataStore
  try {
    current = replayOutbox(state.base, state.outbox)
  } catch {
    throw localStateError(
      command,
      'INVALID_STATE',
      'State outbox cannot be replayed'
    )
  }
  return {
    exists,
    path,
    state,
    current,
    revision: stateRevision(state),
  }
}

function parseBase(value: unknown, command: string): TDataStore {
  if (!isRecord(value) || !isFiniteNumber(value.serverTimestamp))
    throw localStateError(
      command,
      'INVALID_STATE',
      'State base timestamp is invalid'
    )
  assertExactKeys(value, ['serverTimestamp', ...dataKeys], command, 'base')
  dataKeys.forEach(key => {
    if (!isRecord(value[key]))
      throw localStateError(
        command,
        'INVALID_STATE',
        `State base.${key} must be an object map`
      )
  })
  return value as TDataStore
}

function parseReceipt(
  value: unknown,
  index: number,
  command: string
): TRecentRequestReceipt {
  if (!isRecord(value))
    throw localStateError(
      command,
      'INVALID_STATE',
      `recentRequests[${index}] must be an object`
    )
  assertExactKeys(
    value,
    ['requestId', 'command', 'inputHash', 'completedAt', 'receipt'],
    command,
    `recentRequests[${index}]`
  )
  if (
    typeof value.requestId !== 'string' ||
    !/^[A-Za-z0-9._:-]{1,128}$/.test(value.requestId) ||
    typeof value.command !== 'string' ||
    typeof value.inputHash !== 'string' ||
    !isFiniteNumber(value.completedAt) ||
    !isRecord(value.receipt) ||
    Object.values(value.receipt).some(item => !isReceiptValue(item))
  )
    throw localStateError(
      command,
      'INVALID_STATE',
      `recentRequests[${index}] is invalid`
    )
  return value as TRecentRequestReceipt
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
    throw localStateError(
      command,
      'INVALID_STATE',
      `${path} has ${invalid ? `unknown key ${invalid}` : `missing key ${missing}`}`
    )
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value))
    return `[${value.map(item => canonicalJson(item)).join(',')}]`
  if (isRecord(value))
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`
  return JSON.stringify(value)
}

function hashInput(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function validateRequestId(requestId: string, command: string): void {
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(requestId))
    throw new ToolError(
      command,
      'local',
      'INVALID_REQUEST_ID',
      'Request id must match [A-Za-z0-9._:-] and be 1-128 characters',
      2
    )
}

function localStateError(
  command: string,
  code: string,
  message: string,
  details?: Record<string, string | number | boolean | null>
): ToolError {
  return new ToolError(command, 'none', code, message, 5, details)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isReceiptValue(value: unknown): value is TReceiptValue {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    isFiniteNumber(value)
  )
}

function hasCode(error: unknown, code: string): boolean {
  return isRecord(error) && error.code === code
}
