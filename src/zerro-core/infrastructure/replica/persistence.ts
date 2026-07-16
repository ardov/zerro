import type { TOutboxEntry } from './outbox'
import {
  isTransactionEditableField,
  isTransactionRecreateField,
} from '../../application/materializer'

export const replicaPersistenceVersion = 1 as const

export type TPersistedReplica = {
  version: typeof replicaPersistenceVersion
  baseServerTimestamp: number
  outbox: TOutboxEntry[]
  outboxHead: number
}

const patchKeys = new Set([
  'serverTimestamp',
  'deletion',
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
])

export function parsePersistedReplica(
  value: unknown
): TPersistedReplica | undefined {
  if (value === undefined || value === null) return undefined
  if (!isRecord(value))
    throw new Error('Invalid persisted Core replica: expected an object')
  if (value.version !== replicaPersistenceVersion)
    throw new Error(
      `Invalid persisted Core replica: unsupported version ${String(value.version)}`
    )
  if (!isFiniteNumber(value.baseServerTimestamp))
    throw new Error('Invalid persisted Core replica: invalid base timestamp')
  if (!Array.isArray(value.outbox))
    throw new Error('Invalid persisted Core replica: outbox must be an array')
  if (
    typeof value.outboxHead !== 'number' ||
    !Number.isInteger(value.outboxHead) ||
    value.outboxHead < 0 ||
    value.outboxHead > value.outbox.length
  )
    throw new Error(
      'Invalid persisted Core replica: outbox head is out of range'
    )
  value.outbox.forEach((entry, index) => validateOutboxEntry(entry, index))
  return value as TPersistedReplica
}

function validateOutboxEntry(value: unknown, index: number): void {
  if (!isRecord(value))
    throw new Error(
      `Invalid persisted Core replica: outbox[${index}] is not an object`
    )
  if (!isFiniteNumber(value.createdAt))
    throw new Error(
      `Invalid persisted Core replica: outbox[${index}] metadata is invalid`
    )
  validateCommand(value, `outbox[${index}]`)
}

function validateCommand(value: unknown, path: string): void {
  if (!isRecord(value) || typeof value.type !== 'string') {
    throw new Error(`Invalid persisted Core replica: ${path} is invalid`)
  }

  if (value.type === 'patch') {
    validatePatch(value.payload, `${path}.payload`)
    return
  }

  if (value.type === 'transactions.patch') {
    if (
      !isRecord(value.payload) ||
      !Array.isArray(value.payload.ids) ||
      value.payload.ids.length === 0 ||
      value.payload.ids.some(id => typeof id !== 'string') ||
      !isRecord(value.payload.set) ||
      Object.keys(value.payload.set).length === 0 ||
      Object.keys(value.payload.set).some(
        key => !isTransactionEditableField(key)
      )
    ) {
      throw new Error(`Invalid persisted Core replica: ${path} is invalid`)
    }
    return
  }

  if (value.type === 'transaction.recreate') {
    if (
      !isRecord(value.payload) ||
      typeof value.payload.sourceId !== 'string' ||
      typeof value.payload.replacementId !== 'string' ||
      value.payload.sourceId === value.payload.replacementId ||
      !isRecord(value.payload.set) ||
      !isFiniteNumber(value.payload.set.created) ||
      !isFiniteNumber(value.payload.set.income) ||
      !isFiniteNumber(value.payload.set.outcome) ||
      Object.keys(value.payload.set).some(
        key => !isTransactionRecreateField(key)
      )
    ) {
      throw new Error(`Invalid persisted Core replica: ${path} is invalid`)
    }
    return
  }

  throw new Error(`Invalid persisted Core replica: ${path}.type is invalid`)
}

function validatePatch(value: unknown, path: string): void {
  if (!isRecord(value))
    throw new Error(`Invalid persisted Core replica: ${path} is not an object`)
  for (const [key, patchValue] of Object.entries(value)) {
    if (!patchKeys.has(key)) {
      throw new Error(
        `Invalid persisted Core replica: ${path}.${key} is invalid`
      )
    }

    if (key === 'serverTimestamp') {
      if (!isFiniteNumber(patchValue)) {
        throw new Error(
          `Invalid persisted Core replica: ${path}.${key} is invalid`
        )
      }
      continue
    }

    if (
      !Array.isArray(patchValue) ||
      patchValue.some(
        entity =>
          !isRecord(entity) ||
          (typeof entity.id !== 'string' && typeof entity.id !== 'number')
      )
    ) {
      throw new Error(
        `Invalid persisted Core replica: ${path}.${key} is invalid`
      )
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
