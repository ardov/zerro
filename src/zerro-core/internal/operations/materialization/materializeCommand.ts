import {
  entityOperationPatch,
  entityOperationTarget,
  isEntityOperation,
  validateEntityOperation,
} from '../../domain/zenmoney/operations'
import { parseZerroOperation } from '../../domain/zerro/operations/types'
import { materializeZerro } from './materializeZerro'
import type { TOperation } from '../../../types'
import type { intentEntityKeys } from '../../domain/zenmoney'
import {
  applyPatch,
  accountRequiredFields,
  accountWritableFields,
  budgetRequiredFields,
  budgetWritableFields,
  getRootUserId,
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
import type { TCommandLabel } from './commandLabel'

export type TCommand = {
  issuedAt: TMsTime
  operations: TOperation[]
  /** What the user did, for history. Inert: nothing below this line reads it. */
  label?: TCommandLabel
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

export function prepareCommand(
  snapshot: TDataStore,
  operations: readonly TOperation[],
  issuedAt: TMsTime,
  label?: TCommandLabel
): TCommand {
  // Copy each touched map once: later operations see earlier writes without
  // mutating the caller's snapshot or copying large maps for every operation.
  const current = { ...snapshot }
  const copied = new Set<string>()
  const prepared: TOperation[] = []
  for (const input of operations) {
    let operation: TOperation
    if (isEntityOperation(input)) {
      validateEntityOperation(input)
      if (input.type === 'entity.delete') operation = { ...input }
      else {
        const target = entityOperationTarget(input)
        const row = entityRegistry.find(row => row.key === target.key)!
        const existing = current[target.key][target.id as never]
        const value =
          input.type.endsWith('.patch') && !existing
            ? pickFields(
                input.value as TEntity,
                ['id', ...row.writableFields].filter(
                  field => field in input.value
                )
              )
            : compileEntityIntents(
                current,
                row,
                [input.value as TEntity],
                issuedAt
              )[0]
        if (!value) continue
        operation = { ...input, value } as TOperation
      }
    } else operation = parseZerroOperation(input)
    prepared.push(operation)
    const target = isEntityOperation(operation)
      ? entityOperationTarget(operation)
      : undefined
    if (
      target &&
      operation.type.endsWith('.patch') &&
      !current[target.key][target.id as never]
    )
      continue
    const intent = isEntityOperation(operation)
      ? entityOperationPatch(operation)
      : materializeZerro(current, operation, issuedAt)
    const patch = materializeIntentPatch(current, intent, issuedAt)
    const copyMap = (key: keyof TDataStore) => {
      if (copied.has(key)) return
      Object.assign(current, { [key]: { ...(current[key] as object) } })
      copied.add(key)
    }
    for (const key of intentPatchKeys) {
      if (key === 'deletion') continue
      if (!patch[key]?.length) continue
      copyMap(key)
      for (const entity of patch[key]!) {
        ;(current[key] as Record<string | number, unknown>)[entity.id] = entity
      }
    }
    for (const deletion of patch.deletion ?? []) {
      copyMap(deletion.object)
      delete (current[deletion.object] as Record<string | number, unknown>)[
        deletion.id
      ]
    }
  }
  return { issuedAt, operations: prepared, ...(label && { label }) }
}

/** Materializes one command against the latest local snapshot. */
export function materializeCommand(
  snapshot: TDataStore,
  command: TCommand,
  changedAt: TMsTime = command.issuedAt
): TNormalizedPatch {
  return materializeOperations(snapshot, command, changedAt, true)
}

/** Expands persisted intent without predicted server side effects. */
export function materializePrimaryCommand(
  snapshot: TDataStore,
  command: TCommand,
  changedAt: TMsTime = command.issuedAt
): TNormalizedPatch {
  return materializeOperations(snapshot, command, changedAt, false)
}

function materializeOperations(
  snapshot: TDataStore,
  command: TCommand,
  changedAt: TMsTime,
  predict: boolean
): TNormalizedPatch {
  let current = snapshot
  let result: TNormalizedPatch = {}
  let pending: TIntentPatch = {}
  let group: string | undefined
  const ids = new Set<string | number>()

  const apply = (intent: TIntentPatch) => {
    const primary = materializeIntentPatch(current, intent, changedAt)
    const patch = predict
      ? withPredictedEffects(current, primary, changedAt)
      : primary
    current = applyPatch(current, patch)
    result = mergeApplied(result, patch)
  }
  const flush = () => {
    if (ids.size) apply(pending)
    pending = {}
    ids.clear()
    group = undefined
  }
  for (const operation of command.operations) {
    if (!isEntityOperation(operation)) {
      flush()
      apply(materializeZerro(current, operation, command.issuedAt))
      continue
    }
    const target = entityOperationTarget(operation)
    const nextGroup = `${target.key}:${target.deletion ? 'delete' : 'write'}`
    // Independent rows of one kind share one map copy and one balance pass.
    // Repeated IDs and cross-kind dependencies retain sequential semantics.
    if (group !== nextGroup || ids.has(target.id)) flush()
    const existing = current[target.key][target.id as never]
    if ((operation.type.endsWith('.patch') || target.deletion) && !existing)
      continue
    group = nextGroup
    ids.add(target.id)
    for (const [key, rows] of Object.entries(entityOperationPatch(operation))) {
      const record = pending as Record<string, unknown[]>
      const values = record[key] ?? (record[key] = [])
      values.push(...rows)
    }
  }
  flush()
  return result
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
 * Rule 2: a write that leaves both amounts stored as zero makes ZenMoney purge
 * the row and answer with a real tombstone rather than an updated entity.
 * Predicting the removal keeps `current` identical to the state the next
 * canonical diff will confirm.
 *
 * The primary patch still carries the amount write, because that is what
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

  const purged = transactions.filter(isPurgedByAmounts)
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
 * ZenMoney stores amounts with four decimals, so anything below half of the
 * last place is stored as `0`. A row whose income and outcome are both stored
 * as `0` is purged — on a create as much as on a rewrite, and for any
 * combination of accounts.
 *
 * The band deliberately stops below the halfway value: `0.00005` was stored as
 * `0` on one side and `0.0001` on the other within a single write, so only
 * amounts that round to zero unambiguously predict a purge.
 *
 * Both amounts at exactly `0` is the one zeroed shape that does not purge. The
 * server rejects `income == outcome == 0` with a 400 on the submitted numbers,
 * before any rounding applies, so that write lands nothing at all.
 */
const storedAsZeroBelow = 0.00005

function isPurgedByAmounts(entity: {
  income: number
  outcome: number
}): boolean {
  if (entity.income === 0 && entity.outcome === 0) return false
  return isStoredAsZero(entity.income) && isStoredAsZero(entity.outcome)
}

function isStoredAsZero(amount: number): boolean {
  return Math.abs(amount) < storedAsZeroBelow
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

/** Sequential operations can create, update and delete the same row. */
function mergeApplied(
  left: TNormalizedPatch,
  right: TNormalizedPatch
): TNormalizedPatch {
  const result: TNormalizedPatch = { ...left }
  for (const key of intentPatchKeys) {
    if (key === 'deletion') continue
    const removed = new Set(
      right.deletion?.filter(row => row.object === key).map(row => row.id)
    )
    const replaced = new Set(right[key]?.map(row => row.id))
    const values = [
      ...(left[key] ?? []).filter(
        row => !removed.has(row.id) && !replaced.has(row.id)
      ),
      ...(right[key] ?? []),
    ]
    if (values.length) (result as Record<string, unknown>)[key] = values
    else delete result[key]
  }
  const deletions = [
    ...(left.deletion ?? []).filter(
      row =>
        !right[row.object as keyof TIntentPatch]?.some(
          value => value.id === row.id
        )
    ),
    ...(right.deletion ?? []),
  ]
  if (deletions.length) result.deletion = deletions
  else delete result.deletion
  return result
}
