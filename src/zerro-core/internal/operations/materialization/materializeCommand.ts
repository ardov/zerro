import type { intentEntityKeys } from '../../domain/zenmoney'
import {
  accountRequiredFields,
  accountWritableFields,
  budgetRequiredFields,
  budgetWritableFields,
  getRootUserId,
  hasDeletableAmounts,
  intentPatchKeys,
  isSameEntityFieldValue,
  makeAccount,
  makeMerchant,
  makeReminder,
  makeReminderMarker,
  makeTag,
  makeTagBudget,
  makeTransaction,
  merchantRequiredFields,
  merchantWritableFields,
  reminderRequiredFields,
  reminderWritableFields,
  reminderMarkerRequiredFields,
  reminderMarkerWritableFields,
  tagRequiredFields,
  tagWritableFields,
  transactionIntentFields,
  transactionRequiredFields,
  transactionWritableFields,
  userWritableFields,
  type TDataStore,
  type TIntentPatch,
  type TMsTime,
  type TNormalizedPatch,
} from '../../domain/zenmoney'

import { predictAccountBalances } from './predictBalances'
import { predictDeletionCascades } from './predictDeletionCascades'

export { intentPatchKeys } from '../../domain/zenmoney'
export type { TIntentPatch } from '../../domain/zenmoney'

const intentPatchKeySet = new Set<string>(intentPatchKeys)

export type TCommand = {
  type: 'patch'
  issuedAt: TMsTime
  patch: TIntentPatch
}

type TEntity = {
  id: string | number
  changed?: number
  deleted?: boolean
  [field: string]: unknown
}

type TEntityRow = {
  key: (typeof intentEntityKeys)[number]
  writableFields: readonly string[]
  requiredFields: readonly string[]
  creationFields?: readonly string[]
  make?: (
    draft: TEntity,
    ctx: ReturnType<typeof deterministicContext>
  ) => TEntity
  /** This type may only modify a row that already exists. */
  existingOnly?: boolean
  existingFields?: (fields: TEntity) => TEntity
  skipExisting?: (current: TEntity) => boolean
  validateCreation?: (entity: TEntity, intent: TEntity) => void
}

const entityRegistry = [
  {
    key: 'user',
    writableFields: userWritableFields,
    requiredFields: [],
    existingOnly: true,
  },
  {
    key: 'account',
    writableFields: accountWritableFields,
    requiredFields: accountRequiredFields,
    make: (draft, ctx) =>
      makeAccount(draft as Parameters<typeof makeAccount>[0], ctx) as TEntity,
  },
  {
    key: 'reminder',
    writableFields: reminderWritableFields,
    requiredFields: reminderRequiredFields,
    make: (draft, ctx) =>
      makeReminder(draft as Parameters<typeof makeReminder>[0], ctx) as TEntity,
  },
  {
    key: 'reminderMarker',
    writableFields: reminderMarkerWritableFields,
    requiredFields: reminderMarkerRequiredFields,
    make: (draft, ctx) =>
      makeReminderMarker(
        draft as Parameters<typeof makeReminderMarker>[0],
        ctx
      ) as TEntity,
  },
  {
    key: 'merchant',
    writableFields: merchantWritableFields,
    requiredFields: merchantRequiredFields,
    make: (draft, ctx) =>
      makeMerchant(draft as Parameters<typeof makeMerchant>[0], ctx) as TEntity,
  },
  {
    key: 'tag',
    writableFields: tagWritableFields,
    requiredFields: tagRequiredFields,
    make: (draft, ctx) =>
      makeTag(draft as Parameters<typeof makeTag>[0], ctx) as TEntity,
  },
  {
    key: 'budget',
    writableFields: budgetWritableFields,
    requiredFields: budgetRequiredFields,
    make: (draft, ctx) =>
      makeTagBudget(
        draft as Parameters<typeof makeTagBudget>[0],
        ctx
      ) as TEntity,
    validateCreation: (budget, intent) => {
      if (budget.id !== intent.id) {
        throw new Error('Cannot create budget: id does not match date and tag')
      }
    },
  },
  {
    key: 'transaction',
    writableFields: transactionWritableFields,
    creationFields: transactionIntentFields,
    requiredFields: transactionRequiredFields,
    make: (draft, ctx) =>
      makeTransaction(
        draft as Parameters<typeof makeTransaction>[0],
        ctx
      ) as TEntity,
    existingFields: fields => pickTransactionPatch(fields) as TEntity,
    skipExisting: transaction => transaction.deleted === true,
  },
] as const satisfies readonly TEntityRow[]

export function issuePatch(
  snapshot: TDataStore,
  patch: TNormalizedPatch | TIntentPatch,
  issuedAt: TMsTime
): TCommand {
  return {
    type: 'patch',
    issuedAt,
    patch: compileIntentPatch(snapshot, patch, issuedAt),
  }
}

/** Materializes one command against the latest local snapshot. */
export function materializeCommand(
  snapshot: TDataStore,
  command: TCommand,
  changedAt: TMsTime = command.issuedAt
): TNormalizedPatch {
  const patch = materializePrimaryCommand(snapshot, command, changedAt)
  return withPredictedEffects(snapshot, patch, changedAt)
}

/** Expands only persisted user intent, without predicted server side effects. */
export function materializePrimaryCommand(
  snapshot: TDataStore,
  command: TCommand,
  changedAt: TMsTime = command.issuedAt
): TNormalizedPatch {
  return materializeIntentPatch(snapshot, command.patch, changedAt)
}

/**
 * Adds predicted server effects to a primary patch. Local only: transport is
 * built from `materializePrimaryCommand`, so nothing here is ever sent as
 * client intent.
 *
 * Purge runs first, because it decides whether a row still exists before
 * balances ask what that row contributes.
 */
function withPredictedEffects(
  snapshot: TDataStore,
  patch: TNormalizedPatch,
  changedAt: TMsTime
): TNormalizedPatch {
  return predictAccountBalances(
    snapshot,
    predictDeletionCascades(
      snapshot,
      withPurgedTransactions(snapshot, patch, changedAt),
      changedAt
    )
  )
}

/**
 * Rule 2: the exact verified permanent-delete write — both amounts at `0.00001`
 * on the same account — makes ZenMoney purge the row and answer with a real
 * tombstone rather than an updated entity. Predicting the removal keeps
 * `current` identical to the state the next canonical diff will confirm.
 *
 * The primary patch still carries the exact amount write, because that is what
 * triggers the server-side purge. A `deletion` entry would not:
 * ZenMoney converts a direct transaction deletion into a soft delete instead.
 */
function withPurgedTransactions(
  snapshot: TDataStore,
  patch: TNormalizedPatch,
  changedAt: TMsTime
): TNormalizedPatch {
  const transactions = patch.transaction
  if (!transactions?.length) return patch

  const purged = transactions.filter(entity =>
    isPurgedByAmounts(snapshot, entity)
  )
  if (!purged.length) return patch

  const user = requireRootUser(snapshot, 'transaction')
  const result: TNormalizedPatch = { ...patch }
  const remaining = transactions.filter(entity => !purged.includes(entity))
  if (remaining.length) result.transaction = remaining
  else delete result.transaction

  result.deletion = [
    ...(patch.deletion ?? []),
    ...purged.map(entity => ({
      id: entity.id,
      object: 'transaction' as const,
      stamp: changedAt,
      user,
    })),
  ]

  return result
}

/**
 * The purge is an effect of this write, so it is predicted only for the exact
 * verified amount and account shape.
 *
 * A create is never predicted: the purge is verified for rewriting an existing
 * transaction, whether a create behaves the same is untested, and Zerro never
 * issues one. A row already hidden by the read threshold is not re-deleted
 * either — that state is not something this command caused.
 */
function isPurgedByAmounts(
  snapshot: TDataStore,
  entity: {
    id: string
    income: number
    outcome: number
    incomeAccount: string
    outcomeAccount: string
  }
): boolean {
  const stored = snapshot.transaction[entity.id]
  if (!stored) return false
  return (
    entity.income === 0.00001 &&
    entity.outcome === 0.00001 &&
    entity.incomeAccount === entity.outcomeAccount &&
    !hasDeletableAmounts(stored)
  )
}

function materializeIntentPatch(
  snapshot: TDataStore,
  patch: TIntentPatch,
  changedAt: TMsTime
): TNormalizedPatch {
  const result: TNormalizedPatch = { ...patch } as TNormalizedPatch
  const resultByKey = result as Record<string, unknown>
  entityRegistry.forEach(row => {
    const intents = patch[row.key] as TEntity[] | undefined
    if (!intents) return

    const entities = materializeEntityIntents(snapshot, row, intents, changedAt)
    if (entities.length) resultByKey[row.key] = entities
    else delete resultByKey[row.key]
  })

  if (patch.deletion) {
    if (patch.deletion.length) {
      const user = getRootUserId(snapshot.user)
      if (!user) throw new Error('Cannot materialize deletion without user')
      result.deletion = patch.deletion.map(entity => ({
        ...entity,
        stamp: changedAt,
        user,
      }))
    } else {
      delete result.deletion
    }
  }

  return result
}

function compileIntentPatch(
  snapshot: TDataStore,
  patch: TNormalizedPatch | TIntentPatch,
  issuedAt: TMsTime
): TIntentPatch {
  Object.keys(patch).forEach(key => {
    if (key !== 'serverTimestamp' && !intentPatchKeySet.has(key)) {
      throw new Error(`Unsupported command intent: ${key}`)
    }
  })

  const intentPatch = patch
  const result: TIntentPatch = {}
  const resultByKey = result as Record<string, unknown>
  entityRegistry.forEach(row => {
    const entities = intentPatch[row.key] as TEntity[] | undefined
    if (!entities) return

    const intents = compileEntityIntents(snapshot, row, entities, issuedAt)
    if (intents.length) resultByKey[row.key] = intents
    else delete resultByKey[row.key]
  })

  if (intentPatch.deletion) {
    result.deletion = intentPatch.deletion.map(({ id, object }) => ({
      id,
      object,
    }))
  }

  return result
}

function compileEntityIntents(
  snapshot: TDataStore,
  row: TEntityRow,
  entities: readonly TEntity[],
  issuedAt: TMsTime
): TEntity[] {
  const currentById = snapshot[row.key] as Record<string | number, TEntity>
  return entities.flatMap(entity => {
    const current = currentById[entity.id]
    const intent: TEntity = { id: entity.id }
    const fields = current
      ? row.writableFields
      : (row.creationFields ?? row.writableFields)
    fields.forEach(field => {
      if (
        field in entity &&
        (!current ||
          !isSameEntityFieldValue(
            row.key,
            field,
            current[field],
            entity[field]
          ))
      ) {
        intent[field] = entity[field]
      }
    })

    if (!current) {
      if (row.existingOnly) {
        throw new Error(`Cannot create ${row.key}`)
      }
      return [compactEntityCreation(snapshot, row, intent, issuedAt)]
    }
    return Object.keys(intent).length > 1 ? [intent] : []
  })
}

function compactEntityCreation(
  snapshot: TDataStore,
  row: TEntityRow,
  intent: TEntity,
  issuedAt: TMsTime
): TEntity {
  requireFields(row.key, intent, row.requiredFields)
  const baseline = materializeEntityCreation(
    snapshot,
    row,
    pickFields(intent, row.requiredFields),
    issuedAt
  )
  return omitFactoryDefaults(intent, baseline, row.key, row.requiredFields)
}

function materializeEntityIntents(
  snapshot: TDataStore,
  row: TEntityRow,
  intents: readonly TEntity[],
  changedAt: TMsTime
): TEntity[] {
  const currentById = snapshot[row.key] as Record<string | number, TEntity>
  return intents.flatMap(intent => {
    const current = currentById[intent.id]
    if (current && row.skipExisting?.(current)) return []

    const { changed: _ignored, ...rawFields } = intent
    const fields = rawFields as TEntity
    if (current) {
      const applicableFields = row.existingFields?.(fields) ?? fields
      if (patchIsApplied(row.key, current, applicableFields)) return []
      return [
        {
          ...current,
          ...applicableFields,
          changed: nextChanged(
            changedAt,
            current.changed as number | undefined
          ),
        },
      ]
    }
    return [materializeEntityCreation(snapshot, row, intent, changedAt)]
  })
}

function materializeEntityCreation(
  snapshot: TDataStore,
  row: TEntityRow,
  intent: TEntity,
  changedAt: TMsTime
): TEntity {
  if (!row.make) throw new Error(`Cannot create ${row.key}`)
  const user = requireRootUser(snapshot, row.key)
  const entity = row.make({ ...intent, user }, deterministicContext(changedAt))
  row.validateCreation?.(entity, intent)
  return entity
}

function pickFields(intent: TEntity, fields: readonly string[]): TEntity {
  const result: TEntity = { id: intent.id }
  fields.forEach(field => {
    result[field] = intent[field]
  })
  return result
}

function omitFactoryDefaults(
  intent: TEntity,
  baseline: TEntity,
  entityKey: TEntityRow['key'],
  requiredFields: readonly string[]
): TEntity {
  const required = new Set(requiredFields)
  return Object.fromEntries(
    Object.entries(intent).filter(
      ([field, value]) =>
        field === 'id' ||
        required.has(field) ||
        !isSameEntityFieldValue(entityKey, field, baseline[field], value)
    )
  ) as TEntity
}

function requireFields(
  entity: string,
  intent: Record<string, unknown>,
  fields: readonly string[]
): void {
  const missing = fields.filter(field => intent[field] === undefined)
  if (missing.length) {
    throw new Error(`Cannot create ${entity}: missing ${missing.join(', ')}`)
  }
}

function requireRootUser(snapshot: TDataStore, entity: string) {
  const user = getRootUserId(snapshot.user)
  if (!user) throw new Error(`Cannot create ${entity} without user`)
  return user
}

function deterministicContext(now: TMsTime) {
  return {
    now: () => now,
    uuid: () => {
      throw new Error('Materialization must not generate ids')
    },
  }
}

function pickTransactionPatch(
  fields: Record<string, unknown>
): Record<string, unknown> {
  const allowed = new Set<string>(transactionWritableFields)
  return Object.fromEntries(
    Object.entries(fields).filter(([key]) => key === 'id' || allowed.has(key))
  )
}

function patchIsApplied(
  entityKey: TEntityRow['key'],
  current: Record<string, unknown>,
  patch: Record<string, unknown>
): boolean {
  return Object.entries(patch).every(([key, value]) =>
    isSameEntityFieldValue(entityKey, key, current[key], value)
  )
}

function nextChanged(changedAt: number, currentChanged = 0): number {
  // ZenMoney compares second-resolution entity versions strictly.
  return Math.max(changedAt, currentChanged + 1000)
}
