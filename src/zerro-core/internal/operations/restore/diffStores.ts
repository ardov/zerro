/**
 * Store-to-store reconciliation for restore and backup import.
 *
 * Restore cannot create under an absent backup id: ZenMoney hard-deletion
 * tombstones are permanent and this replica does not retain enough history to
 * prove an id is safe to reuse. The planner therefore reconciles desired rows
 * to live current rows first, then allocates a new id only where necessary.
 */
import {
  AccountType,
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
import { isZerroDataAccount } from '../../domain/zerro/accounts'
import {
  hiddenDataSummaryKeys,
  parseHiddenDataComment,
  type THiddenDataSummaryKey,
} from '../../domain/zerro/hidden-data'

type TId = string | number
type TRow = { id: TId; [field: string]: unknown }
type TById = Record<string | number, TRow | undefined>
type TRemoval = 'softDelete' | 'zero' | 'deletion' | null

type TReference = {
  field: string
  key: TIntentEntityKey
  many?: boolean
}

/** What the current pass of the planner has already committed to deleting. */
type TRemovalContext = {
  deletedAccountIds: Set<string>
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
  skipRemoval?: (
    row: TRow,
    current: TDataStore,
    context: TRemovalContext
  ) => boolean
  references?: readonly TReference[]
  generatedId?: boolean
  remap?: (row: TRow, mappings: TRestoreIdMappings) => TRow
  /**
   * Reused only where the backup names the live id, never on resemblance.
   * Reusing a resembling account forces every operation inside it to be
   * removed one at a time as a soft delete — a permanent server-side ratchet.
   * Deletion hard-purges them instead, which is observed server behaviour.
   */
  matchByIdOnly?: boolean
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
    removal: 'deletion',
    skip: row => row.type === AccountType.Debt,
    // ZenMoney's debt account is a protected singleton: deletion is a server
    // no-op, so predicting its removal would make current lie until sync.
    skipRemoval: row => row.type === AccountType.Debt,
    generatedId: true,
    matchByIdOnly: true,
  },
  {
    key: 'merchant',
    writableFields: merchantWritableFields,
    removal: 'deletion',
    // The server silently refuses merchant deletion while an active debt
    // transaction references it. Keeping the merchant is the only local
    // state that remains canonical without first reconciling that debt row.
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
  {
    key: 'tag',
    writableFields: tagWritableFields,
    removal: 'deletion',
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
    // See `bothLegsInsideDeletedAccounts` for why this is skipped.
    skipRemoval: (row, _current, context) =>
      bothLegsInsideDeletedAccounts(row, context),
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
  const removalContext: TRemovalContext = { deletedAccountIds: new Set() }

  seedDebtAccountMapping(current, desired, mappings)

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

    // Exact semantic matches are a multiset: each live current candidate is
    // consumed at most once, so duplicate imported operations retain
    // cardinality. Skipped entirely for a row matched by id alone — see
    // `matchByIdOnly`.
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
      // Empty whenever `matchByIdOnly` skipped populating it above, so this
      // lookup never matches — no separate guard needed here.
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

/**
 * An account leg's type, where the leg may be absent.
 *
 * A soft-deleted row can carry a leg that an account deletion nulled, so a
 * question about "the account on this side" has no answer for it.
 */
function accountTypeOf(
  store: TDataStore,
  id: string | null
): AccountType | undefined {
  return id === null ? undefined : store.account[id]?.type
}

/**
 * Whether a transaction's own removal would be redundant: both of its legs
 * sit on accounts this same plan is already deleting, so the account
 * deletion's cascade purges it without help. A leg that survives — including
 * every debt leg, since the debt account is never deleted — still needs the
 * transaction removed explicitly.
 */
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
    // A deleted hidden-data reminder takes its whole payload with it, and the
    // current store still holds it — so this is countable too.
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

/**
 * Whether a planned account write lands on Zerro's own storage anchor.
 *
 * It is not an account the user keeps — hidden-data writes create it and every
 * other surface in the app hides it — so counting it here would bill Zerro's
 * plumbing as part of what a restore costs. Either side identifies it: a
 * creation intent carries the title, while a removal or an update leaves the
 * title to the live row.
 *
 * Only the count is dropped. The plan still writes it, because restoring past
 * its creation really does remove it, and the next goal or budget write brings
 * it straight back.
 */
function isZerroDataAccountWrite(currentById: TById, intent: TRow): boolean {
  if (isZerroDataAccount(intent)) return true
  const before = currentById[intent.id]
  return !!before && isZerroDataAccount(before)
}

/** What a deleted hidden-data reminder takes with it: its payload entries, or
 * the record itself when the payload is empty. */
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

/**
 * How many entries of Zerro's own state one reminder write moves.
 *
 * The payload is a map keyed by envelope (or by setting), so comparing the
 * comment before and after says which entries changed rather than only that
 * the month's record did. Returns `null` for a reminder that carries no
 * hidden data, or one whose comment cannot be read — an unreadable payload is
 * still a reminder being written, and a preview must not throw on data it does
 * not recognize.
 */
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

/** Structural equality over parsed JSON, which is all a payload ever holds. */
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
