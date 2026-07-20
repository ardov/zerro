import {
  accountRequiredFields,
  accountWritableFields,
  budgetRequiredFields,
  budgetWritableFields,
  getRootUserId,
  intentEntityKeys,
  intentPatchKeys,
  makeAccount,
  makeMerchant,
  makeReminder,
  makeTag,
  makeTagBudget,
  makeTransaction,
  merchantRequiredFields,
  merchantWritableFields,
  reminderRequiredFields,
  reminderWritableFields,
  tagRequiredFields,
  tagWritableFields,
  transactionIntentFields,
  transactionRequiredFields,
  transactionWritableFields,
  type TDataStore,
  type TIntentPatch,
  type TMsTime,
  type TNormalizedPatch,
} from '../../domain/zenmoney'

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
  make: (
    draft: TEntity,
    ctx: ReturnType<typeof deterministicContext>
  ) => TEntity
  existingFields?: (fields: TEntity) => TEntity
  skipExisting?: (current: TEntity) => boolean
  validateCreation?: (entity: TEntity, intent: TEntity) => void
}

const entityRegistry = [
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
  return materializePrimaryCommand(snapshot, command, changedAt)
}

/** Expands only persisted user intent, without predicted server side effects. */
export function materializePrimaryCommand(
  snapshot: TDataStore,
  command: TCommand,
  changedAt: TMsTime = command.issuedAt
): TNormalizedPatch {
  return materializeIntentPatch(snapshot, command.patch, changedAt)
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
      const user = getRootUserId(snapshot)
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
        (!current || !valuesEqual(field, current[field], entity[field]))
      ) {
        intent[field] = entity[field]
      }
    })

    if (!current) {
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
  return omitFactoryDefaults(intent, baseline, row.requiredFields)
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
      if (patchIsApplied(current, applicableFields)) return []
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
  requiredFields: readonly string[]
): TEntity {
  const required = new Set(requiredFields)
  return Object.fromEntries(
    Object.entries(intent).filter(
      ([field, value]) =>
        field === 'id' ||
        required.has(field) ||
        !valuesEqual(field, baseline[field], value)
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
  const user = getRootUserId(snapshot)
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
  current: Record<string, unknown>,
  patch: Record<string, unknown>
): boolean {
  return Object.entries(patch).every(([key, value]) =>
    valuesEqual(key, current[key], value)
  )
}

function valuesEqual(key: string, left: unknown, right: unknown): boolean {
  // ZenMoney canonicalizes an empty transaction comment to null.
  if (key === 'comment') return (left ?? '') === (right ?? '')

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((value, index) => Object.is(value, right[index]))
    )
  }
  return Object.is(left, right)
}

function nextChanged(changedAt: number, currentChanged = 0): number {
  // ZenMoney compares second-resolution entity versions strictly.
  return Math.max(changedAt, currentChanged + 1000)
}
