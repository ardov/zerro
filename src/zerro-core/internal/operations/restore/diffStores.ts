/** Zenmoney tombstones cannot be reused. Match live rows first, then allocate fresh IDs where needed. */
import {
  AccountType,
  type TAccountType,
  accountWritableFields,
  budgetWritableFields,
  entityUpsertOrder,
  getRootUser,
  intentEntityKeys,
  isAbsentRow,
  isSameEntityFieldValue,
  merchantWritableFields,
  pruneUnwritableRows,
  referencesFrom,
  reminderMarkerWritableFields,
  reminderWritableFields,
  tagWritableFields,
  toBudgetId,
  transactionImmutableFields,
  transactionIntentFields,
  transactionWritableFields,
  userWritableFields,
  type TDataStore,
  type TDeletionIntent,
  type TIntentEntityKey,
  type TIntentPatch,
} from '../../domain/zenmoney'
import { isZerroDataAccount } from '../../domain/zerro/accounts'
import {
  hiddenDataSummaryKeys,
  HiddenDataType,
  parseHiddenDataComment,
  type THiddenDataSummaryKey,
} from '../../domain/zerro/hidden-data'
import {
  EnvType,
  envId,
  type TEnvelopeId,
} from '../../domain/zerro/envelope-id'

type TId = string | number
type TRow = { id: TId; [field: string]: unknown }
type TById = Record<string | number, TRow | undefined>
type TRemoval = 'softDelete' | 'zero' | 'deletion' | null

type TReference = {
  field: string
  key: TIntentEntityKey
  many?: boolean
}

type TRemovalContext = {
  deletedAccountIds: Set<string>
}

type TEntityDefinition = {
  writableFields: readonly string[]
  creationFields?: readonly string[]
  semanticFields?: readonly string[]
  existingOnly?: boolean
  removal: TRemoval
  zeroFields?: readonly string[]
  skip?: (row: TRow) => boolean
  isAbsent?: (row: TRow) => boolean
  immutableFields?: readonly string[]
  skipRemoval?: (
    row: TRow,
    current: TDataStore,
    context: TRemovalContext
  ) => boolean
  generatedId?: boolean
  remap?: (row: TRow, mappings: TRestoreIdMappings) => TRow
  /** Match accounts by live ID only. Keeping a similar account would soft-delete its old transactions instead of purging them by cascade. */
  matchByIdOnly?: boolean
}

type TEntityRow = TEntityDefinition & {
  key: TIntentEntityKey
  references: readonly TReference[]
}

const entityDefinitions: Record<TIntentEntityKey, TEntityDefinition> = {
  user: {
    writableFields: userWritableFields,
    removal: null,
    existingOnly: true,
    skip: row => row.parent !== null,
  },
  account: {
    writableFields: accountWritableFields,
    removal: 'deletion',
    skip: row => row.type === AccountType.Debt,
    // Zenmoney's debt account is a protected singleton: deletion is a server
    // no-op, so predicting its removal would make current lie until sync.
    skipRemoval: row => row.type === AccountType.Debt,
    generatedId: true,
    matchByIdOnly: true,
  },
  merchant: {
    writableFields: merchantWritableFields,
    // MCC is editable metadata; it does not change title-based backup matching.
    semanticFields: ['title'],
    removal: 'deletion',
    // An active debt blocks merchant deletion. Keep the merchant until that debt is reconciled.
    skipRemoval: (merchant, current) =>
      Object.values(current.transaction).some(
        transaction =>
          !transaction.deleted &&
          transaction.merchant === merchant.id &&
          (accountTypeOf(current, transaction.incomeAccount) ===
            AccountType.Debt ||
            accountTypeOf(current, transaction.outcomeAccount) ===
              AccountType.Debt)
      ),
    generatedId: true,
  },
  tag: {
    writableFields: tagWritableFields,
    removal: 'deletion',
    generatedId: true,
  },
  reminder: {
    writableFields: reminderWritableFields,
    removal: 'deletion',
    generatedId: true,
    remap: (row, mappings) => ({
      ...row,
      comment: remapHiddenDataComment(row.comment, mappings),
    }),
  },
  reminderMarker: {
    writableFields: reminderMarkerWritableFields,
    removal: 'deletion',
    generatedId: true,
    isAbsent: row => isAbsentRow('reminderMarker', row),
  },
  transaction: {
    writableFields: transactionWritableFields,
    creationFields: transactionIntentFields,
    semanticFields: transactionIntentFields,
    immutableFields: transactionImmutableFields,
    removal: 'softDelete',
    generatedId: true,
    skip: row => row.deleted === true,
    skipRemoval: (row, _current, context) =>
      bothLegsInsideDeletedAccounts(row, context),
  },
  budget: {
    writableFields: budgetWritableFields,
    removal: 'zero',
    zeroFields: ['income', 'outcome'],
    // `tag` arrives already remapped: the identity is derived from it, never
    // mapped a second time.
    remap: row => ({
      ...row,
      id: toBudgetId(
        row.date as Parameters<typeof toBudgetId>[0],
        row.tag as Parameters<typeof toBudgetId>[1]
      ),
    }),
  },
}

/** Order restore definitions by the reference graph. Any reference to a reallocated ID must be rewritten. */
const entityRows: readonly TEntityRow[] = entityUpsertOrder.map(key => ({
  ...entityDefinitions[key],
  key,
  references: referencesFrom(key).flatMap(reference =>
    isRemappableKey(reference.to)
      ? [{ field: reference.field, key: reference.to, many: reference.many }]
      : []
  ),
}))

function isRemappableKey(key: string): key is TIntentEntityKey {
  return (intentEntityKeys as readonly string[]).includes(key)
}

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

/** Preview uses deterministic IDs. Issuing the real command allocates with ctx.uuid(). */
export function buildRestorePlan(
  current: TDataStore,
  desired: TDataStore,
  options: TRestorePlannerOptions = {}
): TRestorePlan {
  const target = normalizeRestoreTarget(desired)
  const scope = options.scope ?? {}
  const selectedKeys = new Set<string>(scope.entities ?? intentEntityKeys)
  const patch: TIntentPatch = {}
  const patchByKey = patch as Record<string, unknown>
  const deletion: TDeletionIntent[] = []
  const mappings: TRestoreIdMappings = {}
  const removalContext: TRemovalContext = { deletedAccountIds: new Set() }

  seedRootUserMapping(current, target, mappings)
  seedDebtAccountMapping(current, target, mappings)

  entityRows.forEach(row => {
    if (!selectedKeys.has(row.key)) return

    const currentById = (current[row.key] ?? {}) as TById
    const desiredById = (target[row.key] ?? {}) as TById
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
    // keep. Immutable transaction metadata deliberately breaks this match.
    activeDesired.forEach(rawDesired => {
      if (isAbsent(row, rawDesired)) return
      const desiredId = String(rawDesired.id)
      const preMappedId = actualByDesired[desiredId]
      if (preMappedId !== undefined) {
        const preMappedCurrent = currentById[preMappedId]
        if (
          preMappedCurrent &&
          !isSkipped(row, preMappedCurrent) &&
          !isAbsent(row, preMappedCurrent) &&
          participates(scope, row, preMappedCurrent, rawDesired)
        ) {
          consumedCurrent.add(String(preMappedCurrent.id))
          mappedDesired.add(desiredId)
        }
        return
      }
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

    // Consume each semantic match once so duplicate imported rows keep their cardinality.
    const candidatesByFingerprint = new Map<string, TRow[]>()
    if (!row.matchByIdOnly) {
      activeCurrent.forEach(entity => {
        if (consumedCurrent.has(String(entity.id))) return
        const fingerprint = entityFingerprint(row, entity)
        const candidates = candidatesByFingerprint.get(fingerprint) ?? []
        candidates.push(entity)
        candidatesByFingerprint.set(fingerprint, candidates)
      })
    }

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
      if (row.skipRemoval?.(before, current, removalContext)) return
      // Recorded before transaction removal is decided below, since account
      // is processed first and a transaction's own removal depends on it.
      if (row.key === 'account') {
        removalContext.deletedAccountIds.add(String(before.id))
      }
      const removal = removalIntent(row, before, deletion)
      if (removal) intents.push(removal)
    })

    if (intents.length) patchByKey[row.key] = intents
  })

  if (deletion.length) patch.deletion = deletion
  return { patch, mappings }
}

/** Restore can read canonical historical orphans but cannot recreate them; apply the graph's write policies. */
function normalizeRestoreTarget(desired: TDataStore): TDataStore {
  return pruneUnwritableRows(desired)
}

function seedRootUserMapping(
  current: TDataStore,
  desired: TDataStore,
  mappings: TRestoreIdMappings
): void {
  const currentRoot = getRootUser(current.user)
  const desiredRoot = getRootUser(desired.user)
  if (!currentRoot || !desiredRoot) return

  mappings.user = {
    [String(desiredRoot.id)]: currentRoot.id,
  }
}

function seedDebtAccountMapping(
  current: TDataStore,
  desired: TDataStore,
  mappings: TRestoreIdMappings
): void {
  const currentDebt = Object.values(current.account).filter(
    account => account.type === AccountType.Debt
  )
  const desiredDebt = Object.values(desired.account).filter(
    account => account.type === AccountType.Debt
  )
  if (currentDebt.length !== 1 || desiredDebt.length !== 1) return

  mappings.account = {
    [String(desiredDebt[0].id)]: currentDebt[0].id,
  }
}

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

/** Rewrite hidden-data keys after ID remapping. Preserve unknown or unreadable reminder comments intact. */
function remapHiddenDataComment(
  comment: unknown,
  mappings: TRestoreIdMappings
): unknown {
  if (typeof comment !== 'string') return comment
  const hidden = parseHiddenDataComment(comment)
  if (!hidden) return comment

  const remapped =
    hidden.type === HiddenDataType.Budgets ||
    hidden.type === HiddenDataType.Goals
      ? remapEnvelopePayload(hidden.payload, mappings)
      : hidden.type === HiddenDataType.EnvelopeMeta
        ? remapEnvelopeMetadata(hidden.payload, mappings)
        : null

  if (!remapped?.changed) return comment
  return JSON.stringify({ ...hidden, payload: remapped.payload })
}

function remapEnvelopePayload(
  payload: unknown,
  mappings: TRestoreIdMappings
): { payload: unknown; changed: boolean } {
  if (!isObjectRecord(payload)) return { payload, changed: false }

  let changed = false
  const entries = Object.entries(payload).map(([id, value]) => {
    const remapped = remapEnvelopeId(id, mappings)
    changed ||= remapped.changed
    return [remapped.id, value] as const
  })
  return { payload: Object.fromEntries(entries), changed }
}

function remapEnvelopeMetadata(
  payload: unknown,
  mappings: TRestoreIdMappings
): { payload: unknown; changed: boolean } {
  if (!isObjectRecord(payload)) return { payload, changed: false }

  let changed = false
  const entries = Object.entries(payload).map(([key, value]) => {
    const remappedKey = remapEnvelopeId(key, mappings)
    const metadata = remapEnvelopeMetadataEntry(value, mappings)
    changed ||= remappedKey.changed || metadata.changed
    return [remappedKey.id, metadata.value] as const
  })
  return { payload: Object.fromEntries(entries), changed }
}

function remapEnvelopeMetadataEntry(
  value: unknown,
  mappings: TRestoreIdMappings
): { value: unknown; changed: boolean } {
  if (!isObjectRecord(value)) return { value, changed: false }

  const id = remapEnvelopeId(value.id, mappings)
  const parent = remapEnvelopeId(value.parent, mappings)
  if (!id.changed && !parent.changed) return { value, changed: false }
  return {
    value: {
      ...value,
      ...(id.changed ? { id: id.id } : {}),
      ...(parent.changed ? { parent: parent.id } : {}),
    },
    changed: true,
  }
}

function remapEnvelopeId(
  id: unknown,
  mappings: TRestoreIdMappings
): { id: unknown; changed: boolean } {
  if (typeof id !== 'string') return { id, changed: false }
  const parsed = envId.parse(id as TEnvelopeId)
  const entityKey =
    parsed.type === EnvType.Tag
      ? 'tag'
      : parsed.type === EnvType.Account
        ? 'account'
        : parsed.type === EnvType.Merchant
          ? 'merchant'
          : null
  if (!entityKey) return { id, changed: false }

  const mapped = mapId(mappings, entityKey, parsed.id)
  if (mapped === parsed.id) return { id, changed: false }
  return {
    id: envId.get(parsed.type, mapped === null ? null : String(mapped)),
    changed: true,
  }
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function accountTypeOf(
  store: TDataStore,
  id: string | null
): TAccountType | undefined {
  return id === null ? undefined : store.account[id]?.type
}

/** Skip a transaction removal only if both legs are purged by account deletions. The protected debt leg never qualifies. */
function bothLegsInsideDeletedAccounts(
  transaction: TRow,
  context: TRemovalContext
): boolean {
  return (
    legInsideDeletedAccount(transaction.incomeAccount, context) &&
    legInsideDeletedAccount(transaction.outcomeAccount, context)
  )
}

function legInsideDeletedAccount(
  leg: unknown,
  context: TRemovalContext
): boolean {
  return leg !== null && context.deletedAccountIds.has(String(leg))
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

export type TStoreDiffSummaryKey = TIntentEntityKey | THiddenDataSummaryKey

export type TStoreDiffSummary = Partial<
  Record<TStoreDiffSummaryKey, TStoreDiffCounts>
>

export function summarizeStoreDiff(
  current: TDataStore,
  patch: TIntentPatch
): TStoreDiffSummary {
  const summary: TStoreDiffSummary = {}
  const countsFor = (key: TStoreDiffSummaryKey) =>
    (summary[key] ??= { created: 0, updated: 0, removed: 0 })

  intentEntityKeys.forEach(key => {
    const intents = patch[key] as TRow[] | undefined
    if (!intents?.length) return
    const currentById = (current[key] ?? {}) as TById
    intents.forEach(intent => {
      if (key === 'account' && isZerroDataAccountWrite(currentById, intent)) {
        return
      }
      // Both payloads are in hand here, unlike in a list row, so a hidden-data
      // reminder is counted by what moved inside it rather than as one row.
      if (key === 'reminder') {
        const hidden = countHiddenDataChanges(currentById[intent.id], intent)
        if (hidden) {
          const counts = countsFor(hidden.key)
          counts.created += hidden.counts.created
          counts.updated += hidden.counts.updated
          counts.removed += hidden.counts.removed
          return
        }
      }
      const counts = countsFor(key)
      if (!currentById[intent.id]) counts.created += 1
      else if (intent.deleted === true) counts.removed += 1
      else counts.updated += 1
    })
  })

  patch.deletion?.forEach(({ object, id }) => {
    if (!(intentEntityKeys as readonly string[]).includes(object)) return
    if (
      object === 'account' &&
      isZerroDataAccountWrite((current.account ?? {}) as TById, { id })
    ) {
      return
    }
    if (object === 'reminder') {
      const hidden = countHiddenDataRemoval(
        (current.reminder ?? {})[id as string] as TRow | undefined
      )
      if (hidden) {
        countsFor(hidden.key).removed += hidden.removed
        return
      }
    }
    countsFor(object as TIntentEntityKey).removed += 1
  })
  return summary
}

/** Exclude the Zerro data account from the count while retaining its writes in the restore plan. */
function isZerroDataAccountWrite(currentById: TById, intent: TRow): boolean {
  if (isZerroDataAccount(intent)) return true
  const before = currentById[intent.id]
  return !!before && isZerroDataAccount(before)
}

function countHiddenDataRemoval(
  row: TRow | undefined
): { key: THiddenDataSummaryKey; removed: number } | null {
  const parsed = parseHiddenDataComment(asComment(row))
  if (!parsed) return null
  const entries = Object.keys(asPayloadMap(parsed.payload)).length
  return {
    key: hiddenDataSummaryKeys[parsed.type],
    removed: entries || 1,
  }
}

/** Count changed entries by payload key. Fall back to a normal reminder for unreadable or unrelated comments. */
function countHiddenDataChanges(
  before: TRow | undefined,
  after: TRow
): { key: THiddenDataSummaryKey; counts: TStoreDiffCounts } | null {
  const parsedAfter = parseHiddenDataComment(asComment(after))
  if (!parsedAfter) return null

  const beforePayload = asPayloadMap(
    parseHiddenDataComment(asComment(before))?.payload
  )
  const afterPayload = asPayloadMap(parsedAfter.payload)
  const counts: TStoreDiffCounts = { created: 0, updated: 0, removed: 0 }

  new Set([
    ...Object.keys(beforePayload),
    ...Object.keys(afterPayload),
  ]).forEach(entry => {
    const had = entry in beforePayload
    const has = entry in afterPayload
    if (!had) counts.created += 1
    else if (!has) counts.removed += 1
    else if (!isSameJsonValue(beforePayload[entry], afterPayload[entry]))
      counts.updated += 1
  })

  return { key: hiddenDataSummaryKeys[parsedAfter.type], counts }
}

function asComment(row: TRow | undefined): string | null {
  const comment = row?.comment
  return typeof comment === 'string' ? comment : null
}

function asPayloadMap(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === 'object' && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : {}
}

function isSameJsonValue(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b || a === null || b === null) return false
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
      return false
    return a.every((item, index) => isSameJsonValue(item, b[index]))
  }
  if (typeof a !== 'object') return false
  const aKeys = Object.keys(a as object)
  const bKeys = Object.keys(b as object)
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every(
    key =>
      key in (b as object) &&
      isSameJsonValue(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
  )
}
