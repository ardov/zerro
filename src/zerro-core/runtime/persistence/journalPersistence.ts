import {
  dataEntityKeys,
  type TDataEntityKey,
} from '../../internal/domain/zenmoney'
import type {
  TCompactCanonicalTransition,
  TJournalBranch,
  TJournalPoint,
  TJournalValidationStatus,
} from '../../internal/operations/replication/journal'

export const journalPersistenceVersion = 1 as const

export type TPersistedJournal = {
  version: typeof journalPersistenceVersion
  activeBranchId: string
  branches: TJournalBranch[]
}

export function parsePersistedJournal(
  value: unknown
): TPersistedJournal | undefined {
  if (value === undefined || value === null) return undefined
  if (!isRecord(value))
    throw new Error('Invalid persisted journal: expected an object')
  if (value.version !== journalPersistenceVersion)
    throw new Error(
      `Invalid persisted journal: unsupported version ${String(value.version)}`
    )
  if (typeof value.activeBranchId !== 'string' || !value.activeBranchId) {
    throw new Error('Invalid persisted journal: active branch id is invalid')
  }
  if (!Array.isArray(value.branches) || !value.branches.length) {
    throw new Error('Invalid persisted journal: branches must be non-empty')
  }

  const branchIds = new Set<string>()
  value.branches.forEach((branch, index) => {
    validateBranch(branch, index, branchIds)
  })
  if (!branchIds.has(value.activeBranchId)) {
    throw new Error('Invalid persisted journal: active branch does not exist')
  }

  return value as TPersistedJournal
}

function validateBranch(
  value: unknown,
  index: number,
  branchIds: Set<string>
): asserts value is TJournalBranch {
  const path = `branches[${index}]`
  if (!isRecord(value))
    throw new Error(`Invalid persisted journal: ${path} must be an object`)
  if (typeof value.id !== 'string' || !value.id) {
    throw new Error(`Invalid persisted journal: ${path}.id is invalid`)
  }
  if (branchIds.has(value.id)) {
    throw new Error(
      `Invalid persisted journal: duplicate branch id ${value.id}`
    )
  }
  branchIds.add(value.id)
  validateCheckpoint(value.checkpoint, `${path}.checkpoint`)
  validateValidationStatus(
    value.checkpointValidation,
    `${path}.checkpointValidation`
  )
  if (!isFiniteNumber(value.serverTimestamp)) {
    throw new Error(
      `Invalid persisted journal: ${path}.serverTimestamp is invalid`
    )
  }
  if (!Array.isArray(value.points)) {
    throw new Error(
      `Invalid persisted journal: ${path}.points must be an array`
    )
  }

  const pointIds = new Set<string>()
  value.points.forEach((point, pointIndex) => {
    validatePoint(point, `${path}.points[${pointIndex}]`, pointIds)
  })
}

function validateCheckpoint(value: unknown, path: string): void {
  if (!isRecord(value))
    throw new Error(`Invalid persisted journal: ${path} must be an object`)
  if (!isFiniteNumber(value.serverTimestamp)) {
    throw new Error(
      `Invalid persisted journal: ${path}.serverTimestamp is invalid`
    )
  }

  const expectedKeys = new Set<string>(dataEntityKeys)
  Object.keys(value).forEach(key => {
    if (key !== 'serverTimestamp' && !expectedKeys.has(key)) {
      throw new Error(`Invalid persisted journal: ${path}.${key} is invalid`)
    }
  })
  dataEntityKeys.forEach(key => {
    const entities = value[key]
    if (!isRecord(entities)) {
      throw new Error(`Invalid persisted journal: ${path}.${key} is invalid`)
    }
    Object.entries(entities).forEach(([id, entity]) => {
      if (!isRecord(entity)) {
        throw new Error(
          `Invalid persisted journal: ${path}.${key}.${id} is invalid`
        )
      }
      if (typeof entity.id !== 'string' && typeof entity.id !== 'number') {
        throw new Error(
          `Invalid persisted journal: ${path}.${key}.${id}.id is invalid`
        )
      }
    })
  })
}

function validatePoint(
  value: unknown,
  path: string,
  pointIds: Set<string>
): asserts value is TJournalPoint {
  if (!isRecord(value))
    throw new Error(`Invalid persisted journal: ${path} must be an object`)
  if (typeof value.id !== 'string' || !value.id) {
    throw new Error(`Invalid persisted journal: ${path}.id is invalid`)
  }
  if (pointIds.has(value.id)) {
    throw new Error(`Invalid persisted journal: duplicate point id ${value.id}`)
  }
  pointIds.add(value.id)
  validateTransition(value.transition, `${path}.transition`)
  validateValidationStatus(value.validation, `${path}.validation`)
  if (typeof value.pushed !== 'boolean') {
    throw new Error(`Invalid persisted journal: ${path}.pushed is invalid`)
  }
}

function validateTransition(
  value: unknown,
  path: string
): asserts value is TCompactCanonicalTransition {
  if (!isRecord(value))
    throw new Error(`Invalid persisted journal: ${path} must be an object`)
  if ('serverTimestamp' in value && !isFiniteNumber(value.serverTimestamp)) {
    throw new Error(
      `Invalid persisted journal: ${path}.serverTimestamp is invalid`
    )
  }

  const allowed = new Set(['serverTimestamp', 'upsert', 'deletion'])
  Object.keys(value).forEach(key => {
    if (!allowed.has(key))
      throw new Error(`Invalid persisted journal: ${path}.${key} is invalid`)
  })
  if ('upsert' in value) validateUpsert(value.upsert, `${path}.upsert`)
  if ('deletion' in value) validateDeletions(value.deletion, `${path}.deletion`)
  if (
    !('serverTimestamp' in value) &&
    !('upsert' in value) &&
    !('deletion' in value)
  ) {
    throw new Error(`Invalid persisted journal: ${path} is empty`)
  }
}

function validateUpsert(value: unknown, path: string): void {
  if (!isRecord(value))
    throw new Error(`Invalid persisted journal: ${path} must be an object`)
  Object.entries(value).forEach(([object, changes]) => {
    if (!dataEntityKeys.includes(object as TDataEntityKey)) {
      throw new Error(`Invalid persisted journal: ${path}.${object} is invalid`)
    }
    if (!Array.isArray(changes)) {
      throw new Error(`Invalid persisted journal: ${path}.${object} is invalid`)
    }
    changes.forEach((change, index) => {
      const changePath = `${path}.${object}[${index}]`
      if (!isRecord(change)) {
        throw new Error(`Invalid persisted journal: ${changePath} is invalid`)
      }
      if (typeof change.id !== 'string' && typeof change.id !== 'number') {
        throw new Error(
          `Invalid persisted journal: ${changePath}.id is invalid`
        )
      }
      if (!isRecord(change.fields)) {
        throw new Error(
          `Invalid persisted journal: ${changePath}.fields is invalid`
        )
      }
      if ('remove' in change) {
        if (
          !Array.isArray(change.remove) ||
          change.remove.some(field => typeof field !== 'string')
        ) {
          throw new Error(
            `Invalid persisted journal: ${changePath}.remove is invalid`
          )
        }
      }
    })
  })
}

function validateDeletions(value: unknown, path: string): void {
  if (!Array.isArray(value))
    throw new Error(`Invalid persisted journal: ${path} must be an array`)
  value.forEach((deletion, index) => {
    const deletionPath = `${path}[${index}]`
    if (!isRecord(deletion)) {
      throw new Error(`Invalid persisted journal: ${deletionPath} is invalid`)
    }
    if (
      !dataEntityKeys.includes(deletion.object as TDataEntityKey) ||
      (typeof deletion.id !== 'string' && typeof deletion.id !== 'number')
    ) {
      throw new Error(`Invalid persisted journal: ${deletionPath} is invalid`)
    }
  })
}

function validateValidationStatus(
  value: unknown,
  path: string
): asserts value is TJournalValidationStatus {
  if (!isRecord(value) || typeof value.kind !== 'string') {
    throw new Error(`Invalid persisted journal: ${path} is invalid`)
  }
  if (value.kind === 'unknown') return
  if (
    (value.kind !== 'valid' && value.kind !== 'invalid') ||
    !isNonNegativeInteger(value.validatorVersion)
  ) {
    throw new Error(`Invalid persisted journal: ${path} is invalid`)
  }
  if (
    value.kind === 'invalid' &&
    (typeof value.reason !== 'string' || !value.reason)
  ) {
    throw new Error(`Invalid persisted journal: ${path}.reason is invalid`)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0
}
