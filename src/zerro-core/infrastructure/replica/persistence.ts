import type { TOutboxEntry } from './outbox'

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
  if (
    typeof value.id !== 'string' ||
    !isFiniteNumber(value.createdAt) ||
    !Number.isInteger(value.materializerVersion)
  )
    throw new Error(
      `Invalid persisted Core replica: outbox[${index}] metadata is invalid`
    )
  validatePatch(value.intentPatch, `outbox[${index}].intentPatch`)
  validatePatch(value.appliedPatch, `outbox[${index}].appliedPatch`)
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
