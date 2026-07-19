import type { TMsTime } from '../../domain/zenmoney/primitives'
import type {
  TDataStore,
  TDeletionIntent,
  TDiff,
} from '../../domain/zenmoney/store'
import {
  transactionEditableFields,
  type TTransactionPatch,
} from '../../domain/zenmoney/transactions'
import {
  accountWritableFields,
  type TAccountPatch,
} from '../../domain/zenmoney/accounts'
import type { TMerchantPatch } from '../../domain/zenmoney/merchants'
import {
  reminderWritableFields,
  type TReminderPatch,
} from '../../domain/zenmoney/reminders'
import type { TTagPatch } from '../../domain/zenmoney/tags'
import { getRootUserId } from '../../domain/zenmoney/users'

export type TIntentPatch = Omit<
  TDiff,
  | 'serverTimestamp'
  | 'deletion'
  | 'account'
  | 'merchant'
  | 'tag'
  | 'reminder'
  | 'transaction'
> & {
  deletion?: TDeletionIntent[]
  account?: TAccountPatch[]
  merchant?: TMerchantPatch[]
  tag?: TTagPatch[]
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
  return { type: 'patch', issuedAt, patch: compileIntentPatch(snapshot, patch) }
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
      case 'transaction':
        return command.patch.transaction!.every(transaction =>
          hasOnlyFields(transaction, transactionEditableFields)
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

    const entities = intents.flatMap(intent => {
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

      // Until factory-backed upsert lands, only already-complete legacy intent
      // can create a missing entity. Sparse updates remain terminal no-ops.
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
  patch: TDiff | TIntentPatch
): TIntentPatch {
  const { serverTimestamp: _, ...intentPatch } = patch as TDiff
  const result = { ...intentPatch } as TIntentPatch

  if (intentPatch.account) {
    const account = compileExistingEntityIntents(
      snapshot.account,
      intentPatch.account,
      accountWritableFields
    ) as TAccountPatch[]
    if (account.length) result.account = account
    else delete result.account
  }

  if (intentPatch.reminder) {
    const reminder = compileExistingEntityIntents(
      snapshot.reminder,
      intentPatch.reminder,
      reminderWritableFields
    ) as TReminderPatch[]
    if (reminder.length) result.reminder = reminder
    else delete result.reminder
  }

  if (intentPatch.deletion) {
    result.deletion = intentPatch.deletion.map(({ id, object }) => ({
      id,
      object,
    }))
  }

  return result
}

function compileExistingEntityIntents(
  currentById: Record<
    string | number,
    ({ id: string | number } & Record<string, unknown>) | undefined
  >,
  entities: readonly ({ id: string | number } & Record<string, unknown>)[],
  writableFields: readonly string[]
): Array<{ id: string | number } & Record<string, unknown>> {
  return entities.flatMap(entity => {
    const current = currentById[entity.id]
    if (!current) return [entity]

    const intent: { id: string | number } & Record<string, unknown> = {
      id: entity.id,
    }
    writableFields.forEach(field => {
      if (
        field in entity &&
        !valuesEqual(field, current[field], entity[field])
      ) {
        intent[field] = entity[field]
      }
    })
    return Object.keys(intent).length > 1 ? [intent] : []
  })
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
  const allowed = new Set<string>(transactionEditableFields)
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
