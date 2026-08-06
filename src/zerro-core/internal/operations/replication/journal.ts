import {
  applyPatch,
  dataEntityKeys,
  type TDataEntityKey,
  type TDataStore,
} from '../../domain/zenmoney'
import {
  summarizeCanonicalTransition,
  type TChangeSummary,
} from './changeSummary'

export type TCompactDeletion = {
  object: TDataEntityKey
  id: string | number
}

export type TCompactEntityChange = {
  id: string | number
  fields: Record<string, unknown>
  remove?: string[]
}

export type TCompactCanonicalTransition = {
  serverTimestamp?: number
  upsert?: Partial<Record<TDataEntityKey, TCompactEntityChange[]>>
  deletion?: TCompactDeletion[]
}

export type TJournalValidationStatus =
  | { kind: 'unknown' }
  | { kind: 'valid'; validatorVersion: number }
  | { kind: 'invalid'; validatorVersion: number; reason: string }

export type TJournalPoint = {
  id: string
  transition: TCompactCanonicalTransition
  validation: TJournalValidationStatus
  /** True for a point produced by the user's own push, false for a pull. */
  pushed: boolean
}

export type TJournalPointRef = {
  branchId: string
  /** `null` selects the branch checkpoint; otherwise selects that point. */
  pointId: string | null
}

export type TJournalHistoryEntry = {
  ref: TJournalPointRef
  branchId: string
  kind: 'checkpoint' | 'sync'
  serverTimestamp: number
  validation: TJournalValidationStatus
  /** A checkpoint is always shown; only an unpushed sync point may collapse. */
  pushed: boolean
  /** What this point changed against the one before it. Absent on a
   * checkpoint, which is a whole state rather than a change. */
  summary?: TChangeSummary
}

export type TJournalBranch = {
  id: string
  checkpoint: TDataStore
  /** Lazy, cached like a point's `validation` — see `TJournalValidationStatus`. */
  checkpointValidation: TJournalValidationStatus
  serverTimestamp: number
  points: TJournalPoint[]
}

export type TJournalCollection = {
  activeBranchId: string
  branches: TJournalBranch[]
}

export type TJournalRetentionPolicy = {
  maxAgeMs: number
  softMaxBytes: number
  hardMaxBytes: number
}

export const defaultJournalRetentionPolicy = {
  maxAgeMs: 90 * 24 * 60 * 60 * 1000,
  softMaxBytes: 50 * 1024 * 1024,
  hardMaxBytes: 100 * 1024 * 1024,
} as const satisfies TJournalRetentionPolicy

export type TJournalRetentionResult<T extends TJournalCollection> = {
  journal: T
  serializedBytes: number
  compressionRecommended: boolean
  hardLimitExceeded: boolean
}

type TEntityRecord = {
  id: string | number
  [field: string]: unknown
}

type TEntityMap = Record<string, TEntityRecord | undefined>

export function compactCanonicalTransition(
  before: TDataStore,
  after: TDataStore
): TCompactCanonicalTransition | undefined {
  const transition: TCompactCanonicalTransition = {}

  if (!Object.is(before.serverTimestamp, after.serverTimestamp)) {
    transition.serverTimestamp = after.serverTimestamp
  }

  const upsert: Partial<Record<TDataEntityKey, TCompactEntityChange[]>> = {}
  const deletion: TCompactDeletion[] = []

  dataEntityKeys.forEach(object => {
    const beforeById = getEntityMap(before, object)
    const afterById = getEntityMap(after, object)
    const changes: TCompactEntityChange[] = []
    const ids = new Set([...Object.keys(beforeById), ...Object.keys(afterById)])

    ids.forEach(idKey => {
      const beforeEntity = beforeById[idKey]
      const afterEntity = afterById[idKey]

      if (!afterEntity) {
        if (beforeEntity) deletion.push({ object, id: beforeEntity.id })
        return
      }

      if (!beforeEntity) {
        changes.push({
          id: afterEntity.id,
          fields: withoutId(afterEntity),
        })
        return
      }

      const fields: Record<string, unknown> = {}
      const remove: string[] = []

      Object.keys(afterEntity).forEach(field => {
        if (
          field !== 'id' &&
          !deepEqual(beforeEntity[field], afterEntity[field])
        )
          fields[field] = afterEntity[field]
      })
      Object.keys(beforeEntity).forEach(field => {
        if (field !== 'id' && !(field in afterEntity)) remove.push(field)
      })

      if (Object.keys(fields).length || remove.length) {
        changes.push({
          id: afterEntity.id,
          fields,
          ...(remove.length ? { remove } : {}),
        })
      }
    })

    if (changes.length) upsert[object] = changes
  })

  if (Object.keys(upsert).length) transition.upsert = upsert
  if (deletion.length) transition.deletion = deletion

  return Object.keys(transition).length ? transition : undefined
}

export function applyCompactTransition(
  base: TDataStore,
  transition: TCompactCanonicalTransition
): TDataStore {
  const next = applyPatch(base, {
    serverTimestamp: transition.serverTimestamp,
  })
  const mutableNext = next as unknown as Record<TDataEntityKey, TEntityMap>
  const touched = new Set<TDataEntityKey>()

  transition.deletion?.forEach(item => touched.add(item.object))
  Object.keys(transition.upsert ?? {}).forEach(object =>
    touched.add(object as TDataEntityKey)
  )
  touched.forEach(object => {
    mutableNext[object] = { ...getEntityMap(next, object) }
  })

  transition.deletion?.forEach(({ object, id }) => {
    delete getEntityMap(next, object)[id]
  })

  Object.entries(transition.upsert ?? {}).forEach(([object, changes]) => {
    if (!changes) return
    const entityMap = getEntityMap(next, object as TDataEntityKey)

    changes.forEach(change => {
      const previous = entityMap[change.id]
      const entity: TEntityRecord = previous
        ? { ...previous }
        : { id: change.id }
      change.remove?.forEach(field => delete entity[field])
      Object.assign(entity, change.fields)
      entityMap[change.id] = entity
    })
  })

  return next
}

export function replayJournal(
  checkpoint: TDataStore,
  transitions: readonly TCompactCanonicalTransition[]
): TDataStore {
  return transitions.reduce(
    (state, transition) => applyCompactTransition(state, transition),
    checkpoint
  )
}

export function createJournalBranch(
  id: string,
  checkpoint: TDataStore
): TJournalBranch {
  return {
    id,
    checkpoint,
    checkpointValidation: { kind: 'unknown' },
    serverTimestamp: checkpoint.serverTimestamp,
    points: [],
  }
}

export function replayJournalBranch(branch: TJournalBranch): TDataStore {
  const base = replayJournal(
    branch.checkpoint,
    branch.points.map(point => point.transition)
  )
  return { ...base, serverTimestamp: branch.serverTimestamp }
}

/** Lists every retained checkpoint and canonical server point for the history UI. */
export function listJournalHistory(
  journal: TJournalCollection
): TJournalHistoryEntry[] {
  return journal.branches.flatMap(branch => [
    {
      ref: { branchId: branch.id, pointId: null },
      branchId: branch.id,
      kind: 'checkpoint' as const,
      serverTimestamp: branch.checkpoint.serverTimestamp,
      validation: branch.checkpointValidation,
      pushed: true,
    },
    ...branch.points.map(point => ({
      ref: { branchId: branch.id, pointId: point.id },
      branchId: branch.id,
      kind: 'sync' as const,
      serverTimestamp:
        point.transition.serverTimestamp ?? branch.serverTimestamp,
      validation: point.validation,
      pushed: point.pushed,
      summary: summarizeCanonicalTransition(point.transition),
    })),
  ])
}

/** Replays one retained point without applying the live outbox. */
export function replayJournalPoint(
  journal: TJournalCollection,
  ref: TJournalPointRef
): TDataStore | undefined {
  const branch = journal.branches.find(
    candidate => candidate.id === ref.branchId
  )
  if (!branch) return undefined
  if (ref.pointId === null) return branch.checkpoint

  const pointIndex = branch.points.findIndex(point => point.id === ref.pointId)
  if (pointIndex === -1) return undefined

  return replayJournal(
    branch.checkpoint,
    branch.points.slice(0, pointIndex + 1).map(point => point.transition)
  )
}

export function appendCanonicalJournalPoint(
  branch: TJournalBranch,
  before: TDataStore,
  after: TDataStore,
  pointId: string,
  pushed: boolean
): TJournalBranch {
  const transition = compactCanonicalTransition(before, after)
  if (!transition) {
    return { ...branch, serverTimestamp: after.serverTimestamp }
  }

  const hasStateChange = Boolean(transition.upsert || transition.deletion)
  return {
    ...branch,
    serverTimestamp: after.serverTimestamp,
    points: hasStateChange
      ? [
          ...branch.points,
          {
            id: pointId,
            transition,
            validation: { kind: 'unknown' },
            pushed,
          },
        ]
      : branch.points,
  }
}

export function compactJournalBranchAt(
  branch: TJournalBranch,
  count: number
): TJournalBranch {
  const compacted = compactJournalAt(
    branch.checkpoint,
    branch.points.map(point => point.transition),
    count
  )
  return {
    ...branch,
    checkpoint: compacted.checkpoint,
    // The checkpoint is a new snapshot; any cached validation is stale.
    checkpointValidation: { kind: 'unknown' },
    points: branch.points.slice(count),
  }
}

export function compactJournalAt(
  checkpoint: TDataStore,
  transitions: readonly TCompactCanonicalTransition[],
  count: number
): { checkpoint: TDataStore; transitions: TCompactCanonicalTransition[] } {
  if (!Number.isInteger(count) || count < 0 || count > transitions.length) {
    throw new Error('Journal compaction count is out of range')
  }

  return {
    checkpoint: replayJournal(checkpoint, transitions.slice(0, count)),
    transitions: transitions.slice(count),
  }
}

/**
 * Applies the retention policy at a canonical server boundary.
 *
 * Age pruning compacts old points into their branch checkpoint. If the hard
 * byte budget is still exceeded, the oldest sealed branches are removed. The
 * active branch is never removed; when its checkpoint alone is too large the
 * result reports `hardLimitExceeded` so a future codec or UX can handle it.
 */
export function retainJournal<T extends TJournalCollection>(
  journal: T,
  nowServerTimestamp: number,
  policy: TJournalRetentionPolicy = defaultJournalRetentionPolicy
): TJournalRetentionResult<T> {
  validateRetentionPolicy(policy)
  if (!Number.isFinite(nowServerTimestamp)) {
    throw new Error('Journal retention timestamp must be finite')
  }

  const cutoff = nowServerTimestamp - policy.maxAgeMs
  let branches = journal.branches
    .map(branch => compactBranchBefore(branch, cutoff))
    .filter(
      branch =>
        branch.id === journal.activeBranchId || branch.serverTimestamp >= cutoff
    )

  let retained = { ...journal, branches } as T
  let serializedBytes = estimateJournalBytes(retained)

  while (serializedBytes > policy.hardMaxBytes) {
    const sealed = branches.filter(
      branch => branch.id !== journal.activeBranchId
    )
    if (!sealed.length) break

    const oldest = sealed.reduce((candidate, branch) =>
      branch.serverTimestamp < candidate.serverTimestamp ? branch : candidate
    )
    branches = branches.filter(branch => branch.id !== oldest.id)
    retained = { ...journal, branches } as T
    serializedBytes = estimateJournalBytes(retained)
  }

  return {
    journal: retained,
    serializedBytes,
    compressionRecommended: serializedBytes > policy.softMaxBytes,
    hardLimitExceeded: serializedBytes > policy.hardMaxBytes,
  }
}

export function estimateJournalBytes(value: unknown): number {
  const serialized = JSON.stringify(value)
  return new TextEncoder().encode(serialized).byteLength
}

function compactBranchBefore(
  branch: TJournalBranch,
  cutoff: number
): TJournalBranch {
  const firstRetainedIndex = branch.points.findIndex(
    point => getPointServerTimestamp(point, branch) >= cutoff
  )
  const count =
    firstRetainedIndex === -1 ? branch.points.length : firstRetainedIndex
  return count ? compactJournalBranchAt(branch, count) : branch
}

function getPointServerTimestamp(
  point: TJournalPoint,
  branch: TJournalBranch
): number {
  return point.transition.serverTimestamp ?? branch.serverTimestamp
}

function validateRetentionPolicy(policy: TJournalRetentionPolicy): void {
  if (
    !Number.isFinite(policy.maxAgeMs) ||
    policy.maxAgeMs < 0 ||
    !Number.isFinite(policy.softMaxBytes) ||
    policy.softMaxBytes < 0 ||
    !Number.isFinite(policy.hardMaxBytes) ||
    policy.hardMaxBytes < policy.softMaxBytes
  ) {
    throw new Error('Invalid journal retention policy')
  }
}

function getEntityMap(store: TDataStore, object: TDataEntityKey): TEntityMap {
  return store[object] as TEntityMap
}

function withoutId(entity: TEntityRecord): Record<string, unknown> {
  const fields: Record<string, unknown> = {}
  Object.keys(entity).forEach(field => {
    if (field !== 'id') fields[field] = entity[field]
  })
  return fields
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true
  if (typeof left !== 'object' || typeof right !== 'object') return false
  if (left === null || right === null) return false

  const leftIsArray = Array.isArray(left)
  if (leftIsArray !== Array.isArray(right)) return false
  if (leftIsArray) {
    const rightArray = right as unknown[]
    const leftArray = left as unknown[]
    return (
      leftArray.length === rightArray.length &&
      leftArray.every((value, index) => deepEqual(value, rightArray[index]))
    )
  }

  const leftRecord = left as Record<string, unknown>
  const rightRecord = right as Record<string, unknown>
  const leftKeys = Object.keys(leftRecord)
  const rightKeys = Object.keys(rightRecord)
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      key =>
        Object.prototype.hasOwnProperty.call(rightRecord, key) &&
        deepEqual(leftRecord[key], rightRecord[key])
    )
  )
}
