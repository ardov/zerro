/**
 * Store-to-store reconciliation for restore and backup import.
 *
 * Restore cannot create under an absent backup id: ZenMoney hard-deletion
 * tombstones are permanent and this replica does not retain enough history to
 * prove an id is safe to reuse. The planner therefore reconciles desired rows
 * to live current rows first, then allocates a new id only where necessary.
 */
import {
  accountWritableFields,
  budgetWritableFields,
  intentEntityKeys,
  isSameEntityFieldValue,
  merchantWritableFields,
  reminderMarkerWritableFields,
  reminderWritableFields,
  tagWritableFields,
  toBudgetId,
  transactionIntentFields,
  transactionWritableFields,
  userWritableFields,
  type TDataStore,
  type TDeletionIntent,
  type TIntentEntityKey,
  type TIntentPatch,
} from '../../domain/zenmoney'

type TId = string | number
type TRow = { id: TId; [field: string]: unknown }
type TById = Record<string | number, TRow | undefined>
type TRemoval = 'softDelete' | 'zero' | 'deletion' | null

type TReference = {
  field: string
  key: TIntentEntityKey
  many?: boolean
}

type TEntityRow = {
  key: TIntentEntityKey
  writableFields: readonly string[]
  creationFields?: readonly string[]
  semanticFields?: readonly string[]
  existingOnly?: boolean
  removal: TRemoval
  zeroFields?: readonly string[]
  skip?: (row: TRow) => boolean
  isAbsent?: (row: TRow) => boolean
  immutableFields?: readonly string[]
  references?: readonly TReference[]
  generatedId?: boolean
  remap?: (row: TRow, mappings: TRestoreIdMappings) => TRow
}

/** Dependency order: every rewritten reference is mapped before it is used. */
const entityRows: readonly TEntityRow[] = [
  {
    key: 'user',
    writableFields: userWritableFields,
    removal: null,
    existingOnly: true,
    skip: row => row.parent !== null,
  },
  {
    key: 'account',
    writableFields: accountWritableFields,
    removal: null,
    generatedId: true,
  },
  {
    key: 'merchant',
    writableFields: merchantWritableFields,
    removal: null,
    generatedId: true,
  },
  {
    key: 'tag',
    writableFields: tagWritableFields,
    removal: null,
    generatedId: true,
    references: [{ field: 'parent', key: 'tag' }],
  },
  {
    key: 'reminder',
    writableFields: reminderWritableFields,
    removal: 'deletion',
    generatedId: true,
    references: [
      { field: 'incomeAccount', key: 'account' },
      { field: 'outcomeAccount', key: 'account' },
      { field: 'tag', key: 'tag', many: true },
      { field: 'merchant', key: 'merchant' },
    ],
  },
  {
    key: 'reminderMarker',
    writableFields: reminderMarkerWritableFields,
    removal: 'deletion',
    generatedId: true,
    isAbsent: row => row.state === 'deleted',
    references: [
      { field: 'incomeAccount', key: 'account' },
      { field: 'outcomeAccount', key: 'account' },
      { field: 'tag', key: 'tag', many: true },
      { field: 'merchant', key: 'merchant' },
      { field: 'reminder', key: 'reminder' },
    ],
  },
  {
    key: 'transaction',
    writableFields: transactionWritableFields,
    creationFields: transactionIntentFields,
    semanticFields: transactionIntentFields,
    immutableFields: ['created'],
    removal: 'softDelete',
    generatedId: true,
    skip: row => row.deleted === true,
    references: [
      { field: 'incomeAccount', key: 'account' },
      { field: 'outcomeAccount', key: 'account' },
      { field: 'tag', key: 'tag', many: true },
      { field: 'merchant', key: 'merchant' },
      { field: 'reminderMarker', key: 'reminderMarker' },
    ],
  },
  {
    key: 'budget',
    writableFields: budgetWritableFields,
    removal: 'zero',
    zeroFields: ['income', 'outcome'],
    references: [{ field: 'tag', key: 'tag' }],
    remap: (row, mappings) => {
      const tag = mapId(mappings, 'tag', row.tag as TId | null)
      return {
        ...row,
        tag,
        id: toBudgetId(
          row.date as Parameters<typeof toBudgetId>[0],
          tag as Parameters<typeof toBudgetId>[1]
        ),
      }
    },
  },
]

export type TStoreDiffScope = {
  entities?: readonly TIntentEntityKey[]
  includes?: (key: TIntentEntityKey, row: TRow) => boolean
}

export type TRestoreIdMappings = Partial<
  Record<TIntentEntityKey, Record<string, TId>>
>

export type TRestorePlan = {
  patch: TIntentPatch
  mappings: TRestoreIdMappings
}

export type TRestorePlannerOptions = {
  scope?: TStoreDiffScope
  allocateId?: (key: TIntentEntityKey, desiredId: string) => string
}

/**
 * Builds a transient restore plan. `allocateId` is deterministic in preview
 * and bound to `ctx.uuid()` only while issuing the eventual command.
 */
export function buildRestorePlan(
  current: TDataStore,
  desired: TDataStore,
  options: TRestorePlannerOptions = {}
): TRestorePlan {
  const scope = options.scope ?? {}
  const selectedKeys = new Set<string>(scope.entities ?? intentEntityKeys)
  const patch: TIntentPatch = {}
  const patchByKey = patch as Record<string, unknown>
  const deletion: TDeletionIntent[] = []
  const mappings: TRestoreIdMappings = {}

  entityRows.forEach(row => {
    if (!selectedKeys.has(row.key)) return

    const currentById = (current[row.key] ?? {}) as TById
    const desiredById = (desired[row.key] ?? {}) as TById
    const activeCurrent = sortedRows(currentById).filter(
      entity =>
        !isSkipped(row, entity) &&
        !isAbsent(row, entity) &&
        participates(
          scope,
          row,
          entity,
          desiredById[entity.id] as TRow | undefined
        )
    )
    const activeDesired = orderedDesiredRows(row, desiredById).filter(
      entity =>
        !isSkipped(row, entity) &&
        !isAbsent(row, entity) &&
        participates(
          scope,
          row,
          currentById[entity.id] as TRow | undefined,
          entity
        )
    )
    const consumedCurrent = new Set<string>()
    const mappedDesired = new Set<string>()
    const actualByDesired = (mappings[row.key] ??= {})

    // A live same-id row is the only case where the backup identity is safe to
    // keep. Immutable transaction creation time deliberately breaks this match.
    activeDesired.forEach(rawDesired => {
      if (isAbsent(row, rawDesired)) return
      const desiredEntity = remapEntity(row, rawDesired, mappings)
      const currentEntity = currentById[rawDesired.id]
      if (
        !currentEntity ||
        isSkipped(row, currentEntity) ||
        isAbsent(row, currentEntity) ||
        !participates(scope, row, currentEntity, rawDesired) ||
        immutableDiffers(row, currentEntity, desiredEntity)
      ) {
        return
      }
      actualByDesired[String(rawDesired.id)] = currentEntity.id
      consumedCurrent.add(String(currentEntity.id))
      mappedDesired.add(String(rawDesired.id))
    })

    // Exact semantic matches are a multiset: each live current candidate is
    // consumed at most once, so duplicate imported operations retain cardinality.
    const candidatesByFingerprint = new Map<string, TRow[]>()
    activeCurrent.forEach(entity => {
      if (consumedCurrent.has(String(entity.id))) return
      const fingerprint = entityFingerprint(row, entity)
      const candidates = candidatesByFingerprint.get(fingerprint) ?? []
      candidates.push(entity)
      candidatesByFingerprint.set(fingerprint, candidates)
    })

    activeDesired.forEach(rawDesired => {
      const desiredId = String(rawDesired.id)
      if (isAbsent(row, rawDesired) || mappedDesired.has(desiredId)) return
      const desiredEntity = remapEntity(row, rawDesired, mappings)
      const candidates = candidatesByFingerprint.get(
        entityFingerprint(row, desiredEntity)
      )
      const semanticMatch = candidates?.shift()
      const actualId = semanticMatch
        ? semanticMatch.id
        : row.generatedId
          ? (options.allocateId ?? previewId)(row.key, desiredId)
          : desiredEntity.id
      actualByDesired[desiredId] = actualId
      mappedDesired.add(desiredId)
      if (semanticMatch) consumedCurrent.add(String(semanticMatch.id))
    })

    const intents: TRow[] = []
    activeDesired.forEach(rawDesired => {
      if (isAbsent(row, rawDesired)) return
      const actualId = actualByDesired[String(rawDesired.id)]
      if (actualId === undefined) return
      const desiredEntity = {
        ...remapEntity(row, rawDesired, mappings),
        id: actualId,
      }
      const before = currentById[actualId]
      const intent = before
        ? updateIntent(row, before, desiredEntity)
        : row.existingOnly
          ? undefined
          : creationIntent(row, desiredEntity)
      if (intent) intents.push(intent)
    })

    activeCurrent.forEach(before => {
      if (consumedCurrent.has(String(before.id))) return
      const removal = removalIntent(row, before, deletion)
      if (removal) intents.push(removal)
    })

    if (intents.length) patchByKey[row.key] = intents
  })

  if (deletion.length) patch.deletion = deletion
  return { patch, mappings }
}

/** Preview-safe patch form retained for focused internal callers and tests. */
export function diffStores(
  current: TDataStore,
  desired: TDataStore,
  scope: TStoreDiffScope = {}
): TIntentPatch {
  return buildRestorePlan(current, desired, { scope }).patch
}

function updateIntent(
  row: TEntityRow,
  before: TRow,
  after: TRow
): TRow | undefined {
  const intent: TRow = { id: before.id }
  row.writableFields.forEach(field => {
    if (!(field in after)) return
    if (isSameEntityFieldValue(row.key, field, before[field], after[field])) {
      return
    }
    intent[field] = after[field]
  })
  return Object.keys(intent).length > 1 ? intent : undefined
}

function creationIntent(row: TEntityRow, after: TRow): TRow {
  const intent: TRow = { id: after.id }
  const fields = row.creationFields ?? row.writableFields
  fields.forEach(field => {
    if (after[field] !== undefined) intent[field] = after[field]
  })
  return intent
}

function removalIntent(
  row: TEntityRow,
  before: TRow,
  deletion: TDeletionIntent[]
): TRow | undefined {
  if (row.removal === 'softDelete') return { id: before.id, deleted: true }
  if (row.removal === 'zero') {
    const intent: TRow = { id: before.id }
    row.zeroFields?.forEach(field => {
      if (!isSameEntityFieldValue(row.key, field, before[field], 0)) {
        intent[field] = 0
      }
    })
    return Object.keys(intent).length > 1 ? intent : undefined
  }
  if (row.removal === 'deletion')
    deletion.push({ id: before.id, object: row.key })
  return undefined
}

function remapEntity(
  row: TEntityRow,
  raw: TRow,
  mappings: TRestoreIdMappings
): TRow {
  const remapped = { ...raw }
  row.references?.forEach(reference => {
    const value = raw[reference.field]
    if (reference.many) {
      remapped[reference.field] = Array.isArray(value)
        ? value.map(id => mapId(mappings, reference.key, id as TId))
        : value
    } else {
      remapped[reference.field] = mapId(
        mappings,
        reference.key,
        value as TId | null
      )
    }
  })
  return row.remap ? row.remap(remapped, mappings) : remapped
}

function mapId(
  mappings: TRestoreIdMappings,
  key: TIntentEntityKey,
  id: TId | null
): TId | null {
  if (id === null) return null
  return mappings[key]?.[String(id)] ?? id
}

function entityFingerprint(row: TEntityRow, entity: TRow): string {
  const fields = row.semanticFields ?? row.creationFields ?? row.writableFields
  return fields
    .map(field => `${field}:${canonicalValue(row.key, field, entity[field])}`)
    .join('|')
}

function canonicalValue(
  entityKey: TIntentEntityKey,
  field: string,
  value: unknown
): string {
  if (field === 'comment') return JSON.stringify(value ?? '')
  if (entityKey === 'transaction' && field === 'tag' && Array.isArray(value)) {
    return JSON.stringify([...value].sort())
  }
  return JSON.stringify(value)
}

function immutableDiffers(row: TEntityRow, left: TRow, right: TRow): boolean {
  return (
    row.immutableFields?.some(
      field =>
        !isSameEntityFieldValue(row.key, field, left[field], right[field])
    ) ?? false
  )
}

function participates(
  scope: TStoreDiffScope,
  row: TEntityRow,
  before: TRow | undefined,
  after: TRow | undefined
): boolean {
  if (before && (isSkipped(row, before) || isAbsent(row, before))) {
    before = undefined
  }
  if (after && (isSkipped(row, after) || isAbsent(row, after))) {
    after = undefined
  }
  if (!before && !after) return false
  return (
    !scope.includes ||
    (!!before && scope.includes(row.key, before)) ||
    (!!after && scope.includes(row.key, after))
  )
}

function isSkipped(row: TEntityRow, entity: TRow): boolean {
  return row.skip?.(entity) ?? false
}

function isAbsent(row: TEntityRow, entity: TRow): boolean {
  return row.isAbsent?.(entity) ?? false
}

function sortedRows(byId: TById): TRow[] {
  return Object.values(byId)
    .filter((entity): entity is TRow => !!entity)
    .sort((left, right) => String(left.id).localeCompare(String(right.id)))
}

function orderedDesiredRows(row: TEntityRow, byId: TById): TRow[] {
  const rows = sortedRows(byId)
  if (row.key !== 'tag') return rows

  const result: TRow[] = []
  const pending = [...rows]
  while (pending.length) {
    const ready = pending.filter(tag => {
      const parent = tag.parent as TId | null
      return (
        parent === null || result.some(candidate => candidate.id === parent)
      )
    })
    // Complete-backup validation has already rejected cycles. Keep a stable
    // fallback for scoped callers that intentionally omit a parent.
    const batch = ready.length ? ready : [pending[0]]
    batch.forEach(tag => {
      result.push(tag)
      pending.splice(pending.indexOf(tag), 1)
    })
  }
  return result
}

function previewId(key: TIntentEntityKey, desiredId: string): string {
  return `__restore__:${key}:${desiredId}`
}

export type TStoreDiffCounts = {
  created: number
  updated: number
  removed: number
}

export type TStoreDiffSummary = Partial<
  Record<TIntentEntityKey, TStoreDiffCounts>
>

export function summarizeStoreDiff(
  current: TDataStore,
  patch: TIntentPatch
): TStoreDiffSummary {
  const summary: TStoreDiffSummary = {}
  const countsFor = (key: TIntentEntityKey) =>
    (summary[key] ??= { created: 0, updated: 0, removed: 0 })

  intentEntityKeys.forEach(key => {
    const intents = patch[key] as TRow[] | undefined
    if (!intents?.length) return
    const currentById = (current[key] ?? {}) as TById
    intents.forEach(intent => {
      const counts = countsFor(key)
      if (!currentById[intent.id]) counts.created += 1
      else if (intent.deleted === true) counts.removed += 1
      else counts.updated += 1
    })
  })

  patch.deletion?.forEach(({ object }) => {
    if ((intentEntityKeys as readonly string[]).includes(object)) {
      countsFor(object as TIntentEntityKey).removed += 1
    }
  })
  return summary
}
