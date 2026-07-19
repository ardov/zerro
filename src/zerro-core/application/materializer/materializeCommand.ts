import type { TMsTime } from '../../domain/zenmoney/primitives'
import type {
  TDataStore,
  TDeletionIntent,
  TDiff,
} from '../../domain/zenmoney/store'
import {
  makeTransaction,
  transactionIntentFields,
  transactionWritableFields,
  type TTransactionPatch,
} from '../../domain/zenmoney/transactions'
import {
  accountWritableFields,
  makeAccount,
  type TAccountPatch,
} from '../../domain/zenmoney/accounts'
import {
  budgetWritableFields,
  makeTagBudget,
  type TBudgetPatch,
} from '../../domain/zenmoney/budgets'
import {
  makeMerchant,
  merchantWritableFields,
  type TMerchantPatch,
} from '../../domain/zenmoney/merchants'
import {
  makeReminder,
  reminderWritableFields,
  type TReminderPatch,
} from '../../domain/zenmoney/reminders'
import {
  makeTag,
  tagWritableFields,
  type TTagPatch,
} from '../../domain/zenmoney/tags'
import { getRootUserId } from '../../domain/zenmoney/users'

export type TIntentPatch = Omit<
  TDiff,
  | 'serverTimestamp'
  | 'deletion'
  | 'account'
  | 'merchant'
  | 'tag'
  | 'budget'
  | 'reminder'
  | 'transaction'
> & {
  deletion?: TDeletionIntent[]
  account?: TAccountPatch[]
  merchant?: TMerchantPatch[]
  tag?: TTagPatch[]
  budget?: TBudgetPatch[]
  reminder?: TReminderPatch[]
  transaction?: TTransactionPatch[]
}

export type TCommand = {
  type: 'patch'
  issuedAt: TMsTime
  patch: TIntentPatch
}

export function issuePatch(
  snapshot: TDataStore,
  patch: TDiff | TIntentPatch,
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
): TDiff {
  return materializeIntentPatch(snapshot, command.patch, changedAt)
}

/**
 * Transitional safety check for automatic sync. Sparse entity edits and
 * deletion identity can rebase without overwriting unrelated fields; complete
 * creation intents wait for explicit sync until primary-only transport lands.
 */
export function isCommandRebaseSafe(command: TCommand): boolean {
  const keys = Object.keys(command.patch)
  if (!keys.length) return false

  return keys.every(key => {
    switch (key) {
      case 'account':
        return command.patch.account!.every(account =>
          hasOnlyFields(account, accountWritableFields)
        )
      case 'reminder':
        return command.patch.reminder!.every(reminder =>
          hasOnlyFields(reminder, reminderWritableFields)
        )
      case 'merchant':
        return command.patch.merchant!.every(merchant =>
          hasOnlyFields(merchant, merchantWritableFields)
        )
      case 'tag':
        return command.patch.tag!.every(tag =>
          hasOnlyFields(tag, tagWritableFields)
        )
      case 'budget':
        return command.patch.budget!.every(budget =>
          hasOnlyFields(budget, budgetWritableFields)
        )
      case 'transaction':
        return command.patch.transaction!.every(transaction =>
          hasOnlyFields(transaction, transactionIntentFields)
        )
      case 'deletion':
        return command.patch.deletion!.every(deletion =>
          hasOnlyFields(deletion, ['object'])
        )
      default:
        return false
    }
  })
}

function materializeIntentPatch(
  snapshot: TDataStore,
  patch: TIntentPatch,
  changedAt: TMsTime
): TDiff {
  const result: TDiff = { ...patch } as TDiff
  const entityKeys = [
    'instrument',
    'company',
    'user',
    'merchant',
    'account',
    'tag',
    'budget',
    'reminder',
    'reminderMarker',
    'transaction',
  ] as const

  entityKeys.forEach(key => {
    const intents = patch[key] as
      | Array<{ id: string | number; changed?: number; deleted?: boolean }>
      | undefined
    if (!intents) return

    const currentById = snapshot[key] as Record<
      string | number,
      | ({ id: string | number; changed?: number; deleted?: boolean } & Record<
          string,
          unknown
        >)
      | undefined
    >

    const entities = intents.flatMap<Record<string, unknown>>(intent => {
      const current = currentById[intent.id]
      if (key === 'transaction' && current?.deleted) return []

      const { changed: _ignored, ...fields } = intent
      if (current) {
        const applicableFields =
          key === 'transaction' ? pickTransactionPatch(fields) : fields
        if (patchIsApplied(current, applicableFields)) return []
        return [
          {
            ...current,
            ...applicableFields,
            changed: nextChanged(changedAt, current.changed),
          },
        ]
      }

      if (key === 'account') {
        return [
          materializeAccountCreation(
            snapshot,
            intent,
            changedAt
          ) as unknown as Record<string, unknown>,
        ]
      }
      if (key === 'reminder') {
        return [
          materializeReminderCreation(
            snapshot,
            intent,
            changedAt
          ) as unknown as Record<string, unknown>,
        ]
      }
      if (key === 'merchant') {
        return [
          materializeMerchantCreation(
            snapshot,
            intent,
            changedAt
          ) as unknown as Record<string, unknown>,
        ]
      }
      if (key === 'tag') {
        return [
          materializeTagCreation(
            snapshot,
            intent,
            changedAt
          ) as unknown as Record<string, unknown>,
        ]
      }
      if (key === 'budget') {
        return [
          materializeBudgetCreation(
            snapshot,
            intent,
            changedAt
          ) as unknown as Record<string, unknown>,
        ]
      }
      if (key === 'transaction') {
        return [
          materializeTransactionCreation(
            snapshot,
            intent,
            changedAt
          ) as unknown as Record<string, unknown>,
        ]
      }

      // Other entity families remain transitional until they gain a factory-
      // backed creation rule. Their sparse missing targets are terminal no-ops.
      if (intent.changed === undefined) return []
      return [{ ...fields, changed: changedAt }]
    })

    if (entities.length) {
      ;(result[key] as Array<Record<string, unknown>>) = entities
    } else {
      delete result[key]
    }
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
  patch: TDiff | TIntentPatch,
  issuedAt: TMsTime
): TIntentPatch {
  const { serverTimestamp: _, ...intentPatch } = patch as TDiff
  const result = { ...intentPatch } as TIntentPatch

  if (intentPatch.account) {
    const account = compileEntityIntents(
      snapshot.account,
      intentPatch.account,
      accountWritableFields,
      intent => compactAccountCreation(snapshot, intent, issuedAt)
    ) as TAccountPatch[]
    if (account.length) result.account = account
    else delete result.account
  }

  if (intentPatch.reminder) {
    const reminder = compileEntityIntents(
      snapshot.reminder,
      intentPatch.reminder,
      reminderWritableFields,
      intent => compactReminderCreation(snapshot, intent, issuedAt)
    ) as TReminderPatch[]
    if (reminder.length) result.reminder = reminder
    else delete result.reminder
  }

  if (intentPatch.merchant) {
    const merchant = compileEntityIntents(
      snapshot.merchant,
      intentPatch.merchant,
      merchantWritableFields,
      intent => compactMerchantCreation(snapshot, intent, issuedAt)
    ) as TMerchantPatch[]
    if (merchant.length) result.merchant = merchant
    else delete result.merchant
  }

  if (intentPatch.tag) {
    const tag = compileEntityIntents(
      snapshot.tag,
      intentPatch.tag,
      tagWritableFields,
      intent => compactTagCreation(snapshot, intent, issuedAt)
    ) as TTagPatch[]
    if (tag.length) result.tag = tag
    else delete result.tag
  }

  if (intentPatch.budget) {
    const budget = compileEntityIntents(
      snapshot.budget,
      intentPatch.budget,
      budgetWritableFields,
      intent => compactBudgetCreation(snapshot, intent, issuedAt)
    ) as TBudgetPatch[]
    if (budget.length) result.budget = budget
    else delete result.budget
  }

  if (intentPatch.transaction) {
    const transaction = compileEntityIntents(
      snapshot.transaction,
      intentPatch.transaction,
      transactionWritableFields,
      intent => compactTransactionCreation(snapshot, intent, issuedAt),
      transactionIntentFields
    ) as TTransactionPatch[]
    if (transaction.length) result.transaction = transaction
    else delete result.transaction
  }

  if (intentPatch.deletion) {
    result.deletion = intentPatch.deletion.map(({ id, object }) => ({
      id,
      object,
    }))
  }

  return result
}

function compileEntityIntents(
  currentById: Record<
    string | number,
    ({ id: string | number } & Record<string, unknown>) | undefined
  >,
  entities: readonly ({ id: string | number } & Record<string, unknown>)[],
  writableFields: readonly string[],
  compileCreation: (
    intent: { id: string | number } & Record<string, unknown>
  ) => { id: string | number } & Record<string, unknown>,
  creationFields: readonly string[] = writableFields
): Array<{ id: string | number } & Record<string, unknown>> {
  return entities.flatMap(entity => {
    const current = currentById[entity.id]
    const intent: { id: string | number } & Record<string, unknown> = {
      id: entity.id,
    }
    const fields = current ? writableFields : creationFields
    fields.forEach(field => {
      if (
        field in entity &&
        (!current || !valuesEqual(field, current[field], entity[field]))
      ) {
        intent[field] = entity[field]
      }
    })

    if (!current) {
      return [compileCreation(intent)]
    }
    return Object.keys(intent).length > 1 ? [intent] : []
  })
}

function compactAccountCreation(
  snapshot: TDataStore,
  intent: { id: string | number } & Record<string, unknown>,
  issuedAt: TMsTime
) {
  const required = ['instrument', 'title'] as const
  requireFields('account', intent, required)
  const baseline = materializeAccountCreation(
    snapshot,
    pickFields(intent, required),
    issuedAt
  ) as unknown as Record<string, unknown>
  return omitFactoryDefaults(intent, baseline, required)
}

function compactReminderCreation(
  snapshot: TDataStore,
  intent: { id: string | number } & Record<string, unknown>,
  issuedAt: TMsTime
) {
  const required = ['incomeAccount', 'outcomeAccount'] as const
  requireFields('reminder', intent, required)
  const baseline = materializeReminderCreation(
    snapshot,
    pickFields(intent, required),
    issuedAt
  ) as unknown as Record<string, unknown>
  return omitFactoryDefaults(intent, baseline, required)
}

function compactMerchantCreation(
  snapshot: TDataStore,
  intent: { id: string | number } & Record<string, unknown>,
  issuedAt: TMsTime
) {
  const required = ['title'] as const
  requireFields('merchant', intent, required)
  const baseline = materializeMerchantCreation(
    snapshot,
    pickFields(intent, required),
    issuedAt
  ) as unknown as Record<string, unknown>
  return omitFactoryDefaults(intent, baseline, required)
}

function compactTagCreation(
  snapshot: TDataStore,
  intent: { id: string | number } & Record<string, unknown>,
  issuedAt: TMsTime
) {
  const required = ['title'] as const
  requireFields('tag', intent, required)
  const baseline = materializeTagCreation(
    snapshot,
    pickFields(intent, required),
    issuedAt
  ) as unknown as Record<string, unknown>
  return omitFactoryDefaults(intent, baseline, required)
}

function compactBudgetCreation(
  snapshot: TDataStore,
  intent: { id: string | number } & Record<string, unknown>,
  issuedAt: TMsTime
) {
  const required = ['tag', 'date'] as const
  requireFields('budget', intent, required)
  const baseline = materializeBudgetCreation(
    snapshot,
    pickFields(intent, required),
    issuedAt
  ) as unknown as Record<string, unknown>
  return omitFactoryDefaults(intent, baseline, required)
}

function compactTransactionCreation(
  snapshot: TDataStore,
  intent: { id: string | number } & Record<string, unknown>,
  issuedAt: TMsTime
) {
  const required = [
    'date',
    'incomeInstrument',
    'incomeAccount',
    'outcomeInstrument',
    'outcomeAccount',
  ] as const
  requireFields('transaction', intent, required)
  const baseline = materializeTransactionCreation(
    snapshot,
    pickFields(intent, required),
    issuedAt
  ) as unknown as Record<string, unknown>
  return omitFactoryDefaults(intent, baseline, required)
}

function pickFields(
  intent: { id: string | number } & Record<string, unknown>,
  fields: readonly string[]
) {
  const result: { id: string | number } & Record<string, unknown> = {
    id: intent.id,
  }
  fields.forEach(field => {
    result[field] = intent[field]
  })
  return result
}

function omitFactoryDefaults(
  intent: { id: string | number } & Record<string, unknown>,
  baseline: Record<string, unknown>,
  requiredFields: readonly string[]
) {
  const required = new Set(requiredFields)
  return Object.fromEntries(
    Object.entries(intent).filter(
      ([field, value]) =>
        field === 'id' ||
        required.has(field) ||
        !valuesEqual(field, baseline[field], value)
    )
  ) as { id: string | number } & Record<string, unknown>
}

function materializeAccountCreation(
  snapshot: TDataStore,
  intent: { id: string | number } & Record<string, unknown>,
  changedAt: TMsTime
) {
  const user = requireRootUser(snapshot, 'account')
  return makeAccount(
    { ...intent, user } as Parameters<typeof makeAccount>[0],
    deterministicContext(changedAt)
  )
}

function materializeReminderCreation(
  snapshot: TDataStore,
  intent: { id: string | number } & Record<string, unknown>,
  changedAt: TMsTime
) {
  const user = requireRootUser(snapshot, 'reminder')
  return makeReminder(
    { ...intent, user } as Parameters<typeof makeReminder>[0],
    deterministicContext(changedAt)
  )
}

function materializeMerchantCreation(
  snapshot: TDataStore,
  intent: { id: string | number } & Record<string, unknown>,
  changedAt: TMsTime
) {
  const user = requireRootUser(snapshot, 'merchant')
  return makeMerchant(
    { ...intent, user } as Parameters<typeof makeMerchant>[0],
    deterministicContext(changedAt)
  )
}

function materializeTagCreation(
  snapshot: TDataStore,
  intent: { id: string | number } & Record<string, unknown>,
  changedAt: TMsTime
) {
  const user = requireRootUser(snapshot, 'tag')
  return makeTag(
    { ...intent, user } as Parameters<typeof makeTag>[0],
    deterministicContext(changedAt)
  )
}

function materializeBudgetCreation(
  snapshot: TDataStore,
  intent: { id: string | number } & Record<string, unknown>,
  changedAt: TMsTime
) {
  const user = requireRootUser(snapshot, 'budget')
  const budget = makeTagBudget(
    { ...intent, user } as Parameters<typeof makeTagBudget>[0],
    deterministicContext(changedAt)
  )
  if (budget.id !== intent.id) {
    throw new Error('Cannot create budget: id does not match date and tag')
  }
  return budget
}

function materializeTransactionCreation(
  snapshot: TDataStore,
  intent: { id: string | number } & Record<string, unknown>,
  changedAt: TMsTime
) {
  const user = requireRootUser(snapshot, 'transaction')
  return makeTransaction(
    { ...intent, user } as Parameters<typeof makeTransaction>[0],
    deterministicContext(changedAt)
  )
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

function hasOnlyFields(
  value: { id: string | number },
  allowedFields: readonly string[]
): boolean {
  const allowed = new Set<string>(['id', ...allowedFields])
  return Object.keys(value).every(key => allowed.has(key))
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
