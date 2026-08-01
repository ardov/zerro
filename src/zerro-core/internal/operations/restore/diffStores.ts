/**
 * Store-to-store diff: the single write path for restoring a point and for
 * importing a backup.
 *
 * `diffStores` answers one question — what user intent moves `current` to
 * `desired` inside a scope — and answers it as an ordinary `TIntentPatch`. It
 * issues nothing: the caller passes the patch through the normal command path,
 * so a restore inherits materialization, transport, and undo like any other
 * change, and there is no second way into the store.
 *
 * The diff is deliberately narrower than "make the stores identical", because
 * only some removals exist as domain operations. Everything it cannot express
 * is listed in `entityRows` below with the reason.
 */
import {
  accountWritableFields,
  budgetWritableFields,
  intentEntityKeys,
  isSameFieldValue,
  merchantWritableFields,
  reminderWritableFields,
  reminderMarkerWritableFields,
  tagWritableFields,
  transactionIntentFields,
  transactionWritableFields,
  userWritableFields,
  type TDataStore,
  type TDeletionIntent,
  type TIntentEntityKey,
  type TIntentPatch,
} from '../../domain/zenmoney'

type TRow = { id: string | number; [field: string]: unknown }

type TById = Record<string | number, TRow | undefined>

/**
 * How a row present in `current` but missing from `desired` is removed.
 *
 * - `softDelete` — the transaction ratchet of materialization.md rule 1. A
 *   `deletion` entry would be converted into the same soft delete anyway.
 * - `zero` — budgets have no delete: a `deletion` entry no-ops and zeroing is
 *   the only removal (materialization.md rule 6).
 * - `deletion` — a real deletion intent, which Core emits for reminders only.
 * - `null` — the domain has no removal for this entity yet.
 */
type TRemoval = 'softDelete' | 'zero' | 'deletion' | null

type TEntityRow = {
  key: TIntentEntityKey
  /** Fields a patch against an existing row may change. */
  writableFields: readonly string[]
  /** Fields a creation intent may carry. Defaults to the writable set. */
  creationFields?: readonly string[]
  /** This entity can only update a live same-id row. */
  existingOnly?: boolean
  removal: TRemoval
  /** Fields written by a `zero` removal. */
  zeroFields?: readonly string[]
  /** Rows the diff must not touch on either side. */
  skip?: (row: TRow) => boolean
  /** A lifecycle representation that means the row is absent from the target. */
  isAbsent?: (row: TRow) => boolean
}

const entityRows = [
  {
    key: 'user',
    writableFields: userWritableFields,
    removal: null,
    existingOnly: true,
    // The root user is an account identity, not a restorable record. Its only
    // writable restore field is the root preference above.
    skip: row => row.parent !== null,
  },
  // Accounts, merchants, and tags have no deletion command, and the cascades a
  // deletion triggers server-side (materialization.md rules 4-7) are not
  // predicted yet. Emitting one would leave transactions pointing at a row that
  // no longer exists locally, so a restore leaves these rows in place.
  { key: 'account', writableFields: accountWritableFields, removal: null },
  { key: 'merchant', writableFields: merchantWritableFields, removal: null },
  { key: 'tag', writableFields: tagWritableFields, removal: null },
  {
    key: 'budget',
    writableFields: budgetWritableFields,
    removal: 'zero',
    zeroFields: ['income', 'outcome'],
  },
  {
    key: 'reminder',
    writableFields: reminderWritableFields,
    removal: 'deletion',
  },
  {
    key: 'reminderMarker',
    writableFields: reminderMarkerWritableFields,
    removal: 'deletion',
    // ZenMoney does not preserve `state: deleted` as an ordinary update. It
    // is the wire representation of absence, so restore turns it into a
    // deletion intent or ignores it when no live marker exists.
    isAbsent: row => row.state === 'deleted',
  },
  {
    key: 'transaction',
    writableFields: transactionWritableFields,
    creationFields: transactionIntentFields,
    removal: 'softDelete',
    // A deleted transaction is inert on both sides: the server never
    // resurrects one, and recreating it under its own id is impossible because
    // a hard-deleted id stays a tombstone. Restoring one is a new transaction
    // with a new id, which is a command, not a diff.
    skip: row => row.deleted === true,
  },
] as const satisfies readonly TEntityRow[]

export type TStoreDiffScope = {
  /** Entity types to consider. Defaults to every writable type. */
  entities?: readonly TIntentEntityKey[]
  /**
   * Decides whether one row participates. A row participates when either side
   * is inside the scope, so a row that moved in or out of the scope between
   * the two stores is not silently skipped.
   */
  includes?: (key: TIntentEntityKey, row: TRow) => boolean
}

/** The user intent that moves `current` toward `desired` inside `scope`. */
export function diffStores(
  current: TDataStore,
  desired: TDataStore,
  scope: TStoreDiffScope = {}
): TIntentPatch {
  const selectedKeys = new Set<string>(scope.entities ?? intentEntityKeys)
  const patch: TIntentPatch = {}
  const patchByKey = patch as Record<string, unknown>
  const deletion: TDeletionIntent[] = []

  entityRows.forEach(row => {
    if (!selectedKeys.has(row.key)) return

    const currentById = (current[row.key] ?? {}) as TById
    const desiredById = (desired[row.key] ?? {}) as TById
    const intents: TRow[] = []

    unionIds(currentById, desiredById).forEach(id => {
      const storedBefore = currentById[id]
      const storedAfter = desiredById[id]
      if (!inScope(scope, row.key, storedBefore, storedAfter)) return
      if (isSkipped(row, storedBefore) || isSkipped(row, storedAfter)) return

      const before = isAbsent(row, storedBefore) ? undefined : storedBefore
      const after = isAbsent(row, storedAfter) ? undefined : storedAfter

      if (!after) {
        if (!before) return
        const removal = removalIntent(row, before, deletion)
        if (removal) intents.push(removal)
        return
      }

      const intent = before
        ? updateIntent(row, before, after)
        : 'existingOnly' in row && row.existingOnly
          ? undefined
          : creationIntent(row, after)
      if (intent) intents.push(intent)
    })

    if (intents.length) patchByKey[row.key] = intents
  })

  if (deletion.length) patch.deletion = deletion
  return patch
}

/** Only fields that differ, so a restore writes nothing it does not change. */
function updateIntent(
  row: TEntityRow,
  before: TRow,
  after: TRow
): TRow | undefined {
  const intent: TRow = { id: before.id }
  row.writableFields.forEach(field => {
    if (!(field in after)) return
    if (isSameFieldValue(field, before[field], after[field])) return
    intent[field] = after[field]
  })
  return Object.keys(intent).length > 1 ? intent : undefined
}

/**
 * A creation keeps the id from `desired`, so references from other restored
 * rows stay valid. Server-owned fields are not carried: the factory fills them
 * from the local user at issue time. Fields that match a factory default are
 * dropped later, by command issue.
 */
function creationIntent(row: TEntityRow, after: TRow): TRow {
  const intent: TRow = { id: after.id }
  const fields = row.creationFields ?? row.writableFields
  fields.forEach(field => {
    if (after[field] === undefined) return
    intent[field] = after[field]
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
      if (isSameFieldValue(field, before[field], 0)) return
      intent[field] = 0
    })
    return Object.keys(intent).length > 1 ? intent : undefined
  }

  if (row.removal === 'deletion') {
    deletion.push({ id: before.id, object: row.key })
  }
  return undefined
}

function isSkipped(row: TEntityRow, entity: TRow | undefined): boolean {
  return entity ? (row.skip?.(entity) ?? false) : false
}

function isAbsent(row: TEntityRow, entity: TRow | undefined): boolean {
  return entity ? (row.isAbsent?.(entity) ?? false) : false
}

function inScope(
  scope: TStoreDiffScope,
  key: TIntentEntityKey,
  before: TRow | undefined,
  after: TRow | undefined
): boolean {
  if (!scope.includes) return true
  return (
    (!!before && scope.includes(key, before)) ||
    (!!after && scope.includes(key, after))
  )
}

/** Sorted so the same pair of stores always produces the same patch. */
function unionIds(current: TById, desired: TById): string[] {
  return [...new Set([...Object.keys(current), ...Object.keys(desired)])].sort()
}

export type TStoreDiffCounts = {
  created: number
  updated: number
  removed: number
}

export type TStoreDiffSummary = Partial<
  Record<TIntentEntityKey, TStoreDiffCounts>
>

/**
 * What a patch does to a store, counted per entity type. This is what a
 * confirmation screen shows before a restore or an import is issued, so it
 * classifies against the store the patch will be applied to rather than
 * against the patch alone.
 */
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
    if (!(intentEntityKeys as readonly string[]).includes(object)) return
    countsFor(object as TIntentEntityKey).removed += 1
  })

  return summary
}
